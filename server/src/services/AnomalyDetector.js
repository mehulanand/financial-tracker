const ss = require('simple-statistics');

// Detect anomalies using Z-Score on the last N prices
const detectAnomaly = (prices, currentPrice, assetName) => {
    if (prices.length < 10) return null; // Need some history

    const values = prices.map(p => p.price);
    const mean = ss.mean(values);
    const sd = ss.standardDeviation(values);

    // Avoid division by zero
    if (sd === 0) return null;

    const zScore = (currentPrice - mean) / sd;
    const percentChange = ((currentPrice - values[values.length - 1]) / values[values.length - 1]) * 100;

    // IGNORE small percentage moves (< 1%) even if Z-Score is high.
    // This prevents alert spam when an asset is very stable (low SD) and moves slightly.
    if (Math.abs(percentChange) < 1.0) return null;

    // Thresholds for anomaly (Increased for stability)
    // Z > 4 = Highly unusual (0.003% probability in normal dist)
    if (Math.abs(zScore) > 4) {
        return {
            severity: Math.abs(zScore) > 6 ? 'HIGH' : 'MEDIUM',
            message: `Unusual price movement (${percentChange.toFixed(2)}%). Z-Score: ${zScore.toFixed(2)}`
        };
    } else if (Math.abs(zScore) > 3) {
        return {
            severity: 'LOW',
            message: `Minor deviations detected (${percentChange.toFixed(2)}%). Z-Score: ${zScore.toFixed(2)}`
        };
    }

    return null;
};

module.exports = { detectAnomaly };
