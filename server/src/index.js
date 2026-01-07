const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { PrismaClient } = require('@prisma/client');
const authRoutes = require('./routes/auth');
const assetRoutes = require('./routes/assets');
const cron = require('node-cron');
const { startPriceScheduler } = require('./services/PriceFetcher');
const { scanMarket } = require('./services/MarketScanner');
const { runStrategy } = require('./services/StrategyEngine');

dotenv.config();

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/assets', assetRoutes);

// Market Anomalies Endpoint
app.get('/api/market-anomalies', async (req, res) => {
  try {
    const anomalies = await prisma.marketAnomaly.findMany({
      orderBy: { timestamp: 'desc' },
      take: 20
    });
    res.json(anomalies);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch market anomalies' });
  }
});

app.get('/', (req, res) => {
  res.send('Financial Tracker API is running');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);

  // 1. Portfolio Price Updates (Every 1 min mostly)
  startPriceScheduler();

  // 2. Global Market Scanner (Every 5 mins)
  cron.schedule('*/5 * * * *', () => {
    console.log('Running Market Scanner...');
    scanMarket();
  });

  // 3. Technical Strategy Engine (Every 30 mins)
  cron.schedule('*/30 * * * *', () => {
    console.log('Running Strategy Engine...');
    runStrategy();
  });

  console.log('Services started: PriceFetcher, MarketScanner(5m), StrategyEngine(30m)');

  // Initial Run
  scanMarket();
});
