const { NseIndia } = require('stock-nse-india');
const nse = new NseIndia();

async function test() {
    console.log('Fetching NSE Market Movers...');
    try {
        console.log('Fetching NIFTY 50 data...');
        const indexData = await nse.getEquityStockIndices("NIFTY 50");
        console.log('Data Type:', typeof indexData);
        if (indexData && indexData.data) {
            console.log('Stocks found:', indexData.data.length);
            console.log('First Stock:', indexData.data[0]);
        } else {
            console.log('No data found in indexData');
        }
    } catch (err) {
        console.error('NSE Error:', err.message);
    }
}

test();
