const yahooFinance = require('yahoo-finance2').default;

async function test() {
    console.log('Testing Yahoo Finance connection...');
    try {
        const symbol = 'AAPL';
        const quote = await yahooFinance.quote(symbol);
        console.log('Success!', quote);
    } catch (error) {
        console.error('Failed:', error.message);
        if (error.response) console.error('Response:', error.response.status);
    }
}

test();
