const cron = require('node-cron');
const axios = require('axios');
const yahooFinance = require('yahoo-finance2').default; // Fix import for CommonJS
const { PrismaClient } = require('@prisma/client');
const { detectAnomaly } = require('./AnomalyDetector');
const { sendEmail } = require('./EmailService');

const prisma = new PrismaClient();



let nse;
try {
    const { NseIndia } = require('stock-nse-india');
    nse = new NseIndia();
} catch (err) {
    console.error("CRITICAL ERROR: Could not load 'stock-nse-india'.");
    console.error("Please ensure you installed it: npm install stock-nse-india");
    console.error("Original Error:", err.message);
}

const fetchIndianStockPrice = async (symbol) => {
    if (!nse) {
        console.error("NSE Library not loaded. Cannot fetch", symbol);
        return null;
    }
    try {
        // Strip .NS suffix if present (e.g. RELIANCE.NS -> RELIANCE)
        const cleanSymbol = symbol.replace('.NS', '').replace('.BO', '');
        const details = await nse.getEquityDetails(cleanSymbol);
        const price = details?.priceInfo?.lastPrice;
        return price || null;
    } catch (err) {
        console.error(`Error fetching Indian stock ${symbol}:`, err.message);
        return null;
    }
};

const fetchStockPrice = async (symbol) => {


    // Better logic: Move routing to updatePrices
    try {
        const apiKey = process.env.FINNHUB_KEY;
        if (!apiKey) {
            console.warn('[WARN] No FINNHUB_KEY in .env. Skipping stock fetch.');
            return null;
        }

        // Finnhub Quote API
        const response = await axios.get(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`);
        const price = response.data?.c; // 'c' is the current price property

        if (!price) return null;
        return price;
    } catch (err) {
        console.error(`Error fetching stock ${symbol} from Finnhub:`, err.message);
        return null;
    }
};

const updatePrices = async () => {
    console.log('Running price update job...');
    const assets = await prisma.asset.findMany({ include: { user: true } });
    if (assets.length === 0) return;

    // 1. Batch Crypto Fetching (CoinGecko allows multiple IDs)
    const cryptoAssets = assets.filter(a => a.type === 'CRYPTO');
    if (cryptoAssets.length > 0) {
        try {
            // Deduplicate symbols for the API call
            const uniqueSymbols = [...new Set(cryptoAssets.map(a => a.symbol.toLowerCase()))];
            // Batch request
            const response = await axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=${uniqueSymbols.join(',')}&vs_currencies=usd`);
            const data = response.data;

            for (const asset of cryptoAssets) {
                const price = data[asset.symbol.toLowerCase()]?.usd;
                if (price) await processPriceUpdate(asset, price);
            }
        } catch (err) {
            console.error('Error fetching crypto batch:', err.message);
        }
    }

    // 2. Throttle Stock Fetching (Yahoo Finance rate limits) -> Now Finnhub + NSE
    const stockAssets = assets.filter(a => a.type === 'STOCK');
    for (const asset of stockAssets) {
        let price = null;

        if (asset.symbol.endsWith('.NS') || asset.symbol.endsWith('.BO')) {
            // Indian Stock
            price = await fetchIndianStockPrice(asset.symbol);
        } else {
            // US/Global Stock (Finnhub)
            // Add slight delay just in case of Finnhub limits
            await new Promise(resolve => setTimeout(resolve, 500));
            price = await fetchStockPrice(asset.symbol);
        }

        if (price) await processPriceUpdate(asset, price);
    }
};

const processPriceUpdate = async (asset, price) => {
    // 1. Save Price History
    await prisma.priceHistory.create({
        data: {
            price,
            assetId: asset.id
        }
    });

    // 2. Fetch recent history for anomaly detection
    const history = await prisma.priceHistory.findMany({
        where: { assetId: asset.id },
        orderBy: { timestamp: 'desc' },
        take: 30
    });

    // 3. Detect Anomaly
    const anomaly = detectAnomaly(history, price, asset.symbol);
    if (anomaly) {
        console.log(`Anomaly detected for ${asset.symbol}: ${anomaly.severity}`);

        // Save Anomaly
        await prisma.anomaly.create({
            data: {
                severity: anomaly.severity,
                message: anomaly.message,
                price,
                assetId: asset.id
            }
        });

        // Create Alert for User
        await prisma.alert.create({
            data: {
                message: anomaly.message,
                userId: asset.userId
            }
        });

        // Send Email if verified
        if (asset.user.isVerified) {
            // await sendEmail(
            //     asset.user.email,
            //     `Asset Alert: ${asset.symbol} - ${anomaly.severity}`,
            //     `At ${new Date().toLocaleString()}, we detected an anomaly:\n\n${anomaly.message}\n\nCurrent Price: ${price}`
            // );
        }
    }
};

const startPriceScheduler = () => {
    // Run every minute
    cron.schedule('*/1 * * * *', updatePrices);
    console.log('Price scheduler started.');
};

module.exports = { startPriceScheduler, updatePrices };
