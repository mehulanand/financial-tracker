import { useRef, useEffect } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

export default function AssetChart({ data, symbol }) {
    const chartData = {
        labels: data.map(d => new Date(d.timestamp).toLocaleTimeString()),
        datasets: [
            {
                label: symbol,
                data: data.map(d => d.price),
                borderColor: '#10B981',
                backgroundColor: 'rgba(16, 185, 129, 0.5)',
                tension: 0.1,
            },
        ],
    };

    const options = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
                labels: { color: 'white' }
            },
            title: {
                display: true,
                text: `${symbol} Price History`,
                color: 'white'
            },
        },
        scales: {
            y: {
                ticks: {
                    color: 'gray',
                    callback: function (value, index, values) {
                        const currency = (symbol && (symbol.endsWith('.NS') || symbol.endsWith('.BO'))) ? '₹' : '$';
                        return currency + value;
                    }
                },
                grid: { color: '#374151' }
            },
            x: {
                ticks: { color: 'gray' },
                grid: { color: '#374151' }
            }
        }
    };

    return <Line options={options} data={chartData} />;
}
