const axios = require('axios');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Fetch historical price data and populate the database
 * @param {Object} asset - The asset object from the database
 * @param {number} days - Number of days of history to fetch (default: from 2018 = ~8 years)
 */
const backfillHistoricalData = async (asset, days = 2920) => {
    console.log(`Backfilling ${days} days of historical data for ${asset.symbol}...`);

    try {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        let historicalPrices = [];

        if (asset.type === 'CRYPTO') {
            historicalPrices = await fetchCryptoHistory(asset.symbol, days);
        } else if (asset.type === 'STOCK') {
            // Skip stocks - neither Finnhub (US) nor NSE (India) provide free historical data
            console.log(`⚠️  Skipping historical data for ${asset.symbol} (Stock APIs don't provide free historical data)`);
            return;
        }

        if (historicalPrices.length === 0) {
            console.log(`No historical data found for ${asset.symbol}`);
            return;
        }

        // Batch insert into database
        await prisma.priceHistory.createMany({
            data: historicalPrices.map(item => ({
                price: item.price,
                timestamp: item.timestamp,
                assetId: asset.id
            })),
            skipDuplicates: true
        });

        console.log(`✅ Backfilled ${historicalPrices.length} historical prices for ${asset.symbol}`);
    } catch (error) {
        console.error(`Error backfilling historical data for ${asset.symbol}:`, error.message);
    }
};

/**
 * Fetch historical crypto prices from CoinGecko
 */
const fetchCryptoHistory = async (symbol, days) => {
    try {
        const coinId = symbol.toLowerCase(); // e.g., 'bitcoin', 'ethereum'
        const url = `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=${days}&interval=daily`;

        const response = await axios.get(url);
        const prices = response.data.prices; // Array of [timestamp_ms, price]

        return prices.map(([timestamp, price]) => ({
            price,
            timestamp: new Date(timestamp)
        }));
    } catch (error) {
        console.error(`CoinGecko historical fetch error for ${symbol}:`, error.message);
        return [];
    }
};


module.exports = { backfillHistoricalData };
