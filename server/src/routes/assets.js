const express = require('express');
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/auth');
const { updatePrices } = require('../services/PriceFetcher');
const { backfillHistoricalData } = require('../services/HistoricalDataFetcher');

const router = express.Router();
const prisma = new PrismaClient();

// Get all assets for user
router.get('/', authMiddleware, async (req, res) => {
    try {
        const assets = await prisma.asset.findMany({
            where: { userId: req.user.userId },
            include: {
                prices: {
                    orderBy: { timestamp: 'desc' },
                    take: 1
                }
            }
        });
        res.json(assets);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add new asset
router.post('/', authMiddleware, async (req, res) => {
    const { symbol, type, name } = req.body;
    // validation...
    try {
        const newAsset = await prisma.asset.create({
            data: {
                symbol,
                type,
                name,
                userId: req.user.userId
            }
        });

        // Trigger an immediate price update check
        updatePrices();

        // Backfill historical data from 2018 (async, don't wait for it)
        backfillHistoricalData(newAsset).catch(err =>
            console.error('Historical backfill error:', err.message)
        );

        res.status(201).json(newAsset);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Get asset details with history
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const asset = await prisma.asset.findUnique({
            where: { id: parseInt(req.params.id) },
            include: {
                prices: {
                    orderBy: { timestamp: 'asc' }, // For charting
                    take: 100 // Limit history for graph
                },
                anomalies: {
                    orderBy: { timestamp: 'desc' },
                    take: 10
                }
            }
        });
        if (!asset) return res.status(404).json({ message: 'Asset not found' });
        if (asset.userId !== req.user.userId) return res.status(403).json({ message: 'Unauthorized' });

        res.json(asset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete asset
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        // Verify ownership
        const asset = await prisma.asset.findUnique({ where: { id: parseInt(req.params.id) } });
        if (!asset || asset.userId !== req.user.userId) return res.status(403).json({ message: 'Unauthorized' });

        await prisma.priceHistory.deleteMany({ where: { assetId: parseInt(req.params.id) } });
        await prisma.anomaly.deleteMany({ where: { assetId: parseInt(req.params.id) } });
        await prisma.asset.delete({ where: { id: parseInt(req.params.id) } });

        res.json({ message: 'Asset deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
