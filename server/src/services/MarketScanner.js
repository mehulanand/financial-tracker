const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

let nse;
try {
    const { NseIndia } = require('stock-nse-india');
    nse = new NseIndia();
} catch (err) {
    console.warn("MarketScanner: 'stock-nse-india' not found. NSE scanning disabled.");
}

const scanMarket = async () => {
    console.log('Running Market Scanner...');

    // 1. Scan NSE India (NIFTY 50 Manual Scan)
    if (nse) {
        try {
            // Fetch NIFTY 50 (Top 50 Companies)
            const indexData = await nse.getEquityStockIndices("NIFTY 50");

            if (indexData && indexData.data) {
                // Filter significant moves (> 2% abs for this trusted list)
                const significantNSE = indexData.data.filter(stock => Math.abs(stock.pChange) > 2);

                for (const stock of significantNSE) {
                    await saveMarketAnomaly({
                        symbol: `${stock.symbol}.NS`,
                        type: 'STOCK',
                        price: stock.lastPrice,
                        message: `${stock.symbol} moved ${stock.pChange}% today.`,
                        severity: Math.abs(stock.pChange) > 4 ? 'HIGH' : 'MEDIUM'
                    });
                }
            }
        } catch (err) {
            console.error('Error scanning NSE:', err.message);
        }
    }

    // 2. Scan Commodities (Specific Watchlist)
    const COMMODITIES = ['GOLDBEES', 'SILVERBEES', 'HINDCOPPER', 'ONGC'];
    if (nse) {
        try {
            for (const symbol of COMMODITIES) {
                // Fetch details for specific symbol
                const details = await nse.getEquityDetails(symbol);
                if (details && details.priceInfo) {
                    const pChange = details.priceInfo.pChange;
                    const price = details.priceInfo.lastPrice;

                    // Threshold for commodities (lower than 4% because they are stable)
                    if (Math.abs(pChange) > 1.5) {
                        await saveMarketAnomaly({
                            symbol: `${symbol}.NS`,
                            type: 'COMMODITY',
                            price: price,
                            message: `${symbol} (Commodity Proxy) moved ${pChange.toFixed(2)}% today.`,
                            severity: Math.abs(pChange) > 3 ? 'HIGH' : 'MEDIUM'
                        });
                    }
                }
            }
        } catch (err) {
            console.error('Error scanning Commodities:', err.message);
        }
    }

    // 3. Scan Crypto (Top 50 by Market Cap)
    try {
        const res = await axios.get('https://api.coingecko.com/api/v3/coins/markets', {
            params: {
                vs_currency: 'usd',
                order: 'market_cap_desc',
                per_page: 50,
                page: 1,
                sparkline: false,
                price_change_percentage: '24h'
            }
        });

        const significantCrypto = res.data.filter(coin => Math.abs(coin.price_change_percentage_24h) > 5);

        for (const coin of significantCrypto) {
            await saveMarketAnomaly({
                symbol: coin.symbol.toUpperCase(),
                type: 'CRYPTO',
                price: coin.current_price,
                message: `${coin.name} moved ${coin.price_change_percentage_24h.toFixed(2)}% in 24h.`,
                severity: Math.abs(coin.price_change_percentage_24h) > 10 ? 'HIGH' : 'MEDIUM'
            });
        }
    } catch (err) {
        console.error('Error scanning Crypto:', err.message);
    }
};

const saveMarketAnomaly = async (data) => {
    // Avoid duplicates for same symbol in last hour
    const existing = await prisma.marketAnomaly.findFirst({
        where: {
            symbol: data.symbol,
            timestamp: {
                gt: new Date(Date.now() - 60 * 60 * 1000) // Last 1 hour
            }
        }
    });

    if (!existing) {
        await prisma.marketAnomaly.create({ data });
        console.log(`[MARKET ANOMALY] ${data.symbol}: ${data.message} (${data.severity})`);
    }
};

module.exports = { scanMarket };
