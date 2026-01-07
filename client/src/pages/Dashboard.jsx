import { useState, useEffect } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import AddAssetModal from '../components/AddAssetModal';
import AssetChart from '../components/AssetChart';
import { Plus, Trash2, TrendingUp, AlertTriangle, LogOut } from 'lucide-react';

export default function Dashboard() {
    const { logout, user } = useAuth();
    const [assets, setAssets] = useState([]);
    const [selectedAsset, setSelectedAsset] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [loading, setLoading] = useState(true);

    const fetchAssets = async () => {
        try {
            const res = await api.get('/assets');
            setAssets(res.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
        }
    };

    const [marketAnomalies, setMarketAnomalies] = useState([]);

    useEffect(() => {
        fetchAssets();
        fetchMarketAnomalies();
        // Poll for updates every 30s
        const interval = setInterval(() => {
            fetchAssets();
            fetchMarketAnomalies();
        }, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchMarketAnomalies = async () => {
        try {
            const res = await api.get('/market-anomalies');
            setMarketAnomalies(res.data);
        } catch (err) {
            console.error('Failed to fetch market anomalies');
        }
    };

    const fetchAssetDetails = async (id) => {
        try {
            const res = await api.get(`/assets/${id}`);
            setSelectedAsset(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = async (e, id) => {
        e.stopPropagation();
        if (!confirm('Are you sure?')) return;
        try {
            await api.delete(`/assets/${id}`);
            setAssets(assets.filter(a => a.id !== id));
            if (selectedAsset?.id === id) setSelectedAsset(null);
        } catch (err) {
            console.error(err);
        }
    };

    const [timeRange, setTimeRange] = useState('1H');

    const getFilteredPrices = () => {
        if (!selectedAsset?.prices) return [];
        const now = new Date();
        const cutoff = new Date();

        switch (timeRange) {
            case '1H': cutoff.setHours(now.getHours() - 1); break;
            case '1D': cutoff.setDate(now.getDate() - 1); break;
            case '1W': cutoff.setDate(now.getDate() - 7); break;
            case '1M': cutoff.setMonth(now.getMonth() - 1); break;
            case 'ALL': return selectedAsset.prices;
            default: return selectedAsset.prices;
        }

        return selectedAsset.prices.filter(p => new Date(p.timestamp) > cutoff);
    };

    const getCurrency = (symbol) => {
        if (!symbol) return '$';
        return (symbol.endsWith('.NS') || symbol.endsWith('.BO')) ? '₹' : '$';
    };

    return (
        <div className="flex flex-col h-screen">
            {/* Header */}
            <header className="bg-gray-800 border-b border-gray-700 p-4 flex justify-between items-center">
                <div className="flex items-center space-x-2">
                    <TrendingUp className="text-emerald-500" />
                    <h1 className="text-xl font-bold text-white">Financial Tracker</h1>
                </div>
                <div className="flex items-center space-x-4">
                    <span className="text-gray-400">{user?.email}</span>
                    <button onClick={logout} className="text-gray-400 hover:text-white">
                        <LogOut size={20} />
                    </button>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar / Asset List */}
                <div className="w-1/3 min-w-[300px] bg-gray-900 border-r border-gray-700 p-4 overflow-y-auto">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold text-gray-200">Your Assets</h2>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="bg-emerald-600 hover:bg-emerald-700 p-2 rounded-full text-white"
                        >
                            <Plus size={20} />
                        </button>
                    </div>

                    <div className="space-y-3">
                        {loading && <div className="text-center text-gray-500">Loading assets...</div>}
                        {assets.map(asset => (
                            <div
                                key={asset.id}
                                onClick={() => fetchAssetDetails(asset.id)}
                                className={`p-4 rounded-lg cursor-pointer border transition-all ${selectedAsset?.id === asset.id
                                    ? 'bg-gray-800 border-emerald-500'
                                    : 'bg-gray-800 border-gray-700 hover:border-gray-600'
                                    }`}
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="font-bold text-white">{asset.symbol}</div>
                                        <div className="text-xs text-gray-400">{asset.name}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-mono text-lg text-emerald-400">
                                            {getCurrency(asset.symbol)}{asset.prices?.[0]?.price?.toFixed(2) || '---'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Main Content / Chart */}
                <div className="flex-1 bg-gray-900 p-6 overflow-y-auto">
                    {selectedAsset ? (
                        <div>
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-white">{selectedAsset.name} ({selectedAsset.symbol})</h2>
                                    <p className="text-gray-400">{selectedAsset.type}</p>
                                </div>
                                <button
                                    onClick={(e) => handleDelete(e, selectedAsset.id)}
                                    className="text-red-500 hover:text-red-400 flex items-center space-x-1"
                                >
                                    <Trash2 size={18} /> <span>Delete</span>
                                </button>
                            </div>

                            <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 mb-6">
                                <div className="flex justify-end space-x-2 mb-4">
                                    {['1H', '1D', '1W', '1M', 'ALL'].map(range => (
                                        <button
                                            key={range}
                                            onClick={() => setTimeRange(range)}
                                            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${timeRange === range
                                                ? 'bg-emerald-600 text-white'
                                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                                }`}
                                        >
                                            {range}
                                        </button>
                                    ))}
                                </div>
                                <AssetChart data={getFilteredPrices()} symbol={selectedAsset.symbol} />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Portfolio Anomalies (Existing) */}
                                <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                                    <h3 className="text-lg font-semibold mb-4 text-white flex items-center">
                                        <AlertTriangle className="mr-2 text-yellow-500" /> Portfolio Alerts
                                    </h3>
                                    {selectedAsset.anomalies.length === 0 ? (
                                        <p className="text-gray-500">No anomalies detected recently.</p>
                                    ) : (
                                        <ul className="space-y-3">
                                            {selectedAsset.anomalies.map(ano => (
                                                <li key={ano.id} className="border-l-4 border-yellow-500 pl-3 py-1">
                                                    <div className="flex justify-between">
                                                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${ano.severity === 'HIGH' ? 'bg-red-900 text-red-200' :
                                                            ano.severity === 'MEDIUM' ? 'bg-yellow-900 text-yellow-200' :
                                                                'bg-blue-900 text-blue-200'
                                                            }`}>
                                                            {ano.severity}
                                                        </span>
                                                        <span className="text-xs text-gray-500">
                                                            {new Date(ano.timestamp).toLocaleString()}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-300 mt-1">{ano.message}</p>
                                                    <p className="text-xs text-emerald-400 mt-1">Price: {getCurrency(selectedAsset.symbol)}{ano.price}</p>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>

                                {/* Market Anomalies (New Scanner) */}
                                <div className="bg-gray-800 p-4 rounded-lg border border-purple-500/30">
                                    <h3 className="text-lg font-semibold mb-4 text-purple-400 flex items-center">
                                        <TrendingUp className="mr-2" /> Global Market Scanner
                                    </h3>
                                    {marketAnomalies.length === 0 ? (
                                        <p className="text-gray-500">Scanning for global anomalies...</p>
                                    ) : (
                                        <ul className="space-y-3 max-h-[300px] overflow-y-auto">
                                            {marketAnomalies.map(ano => (
                                                <li key={ano.id} className="bg-purple-900/10 border border-purple-500/20 p-3 rounded hover:bg-purple-900/20 transition-colors">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className="font-bold text-white">{ano.symbol}</span>
                                                        <span className="text-xs text-purple-300 bg-purple-900/50 px-2 py-1 rounded border border-purple-500/30">{ano.type}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${ano.severity === 'HIGH' ? 'bg-red-900 text-red-200 border border-red-700' : 'bg-orange-900 text-orange-200 border border-orange-700'}`}>
                                                            {ano.severity}
                                                        </span>
                                                        <span className="text-xs text-gray-500">
                                                            {new Date(ano.timestamp).toLocaleTimeString()}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-gray-300 mt-2">{ano.message}</p>
                                                    <p className="text-sm font-mono text-purple-400 mt-1 text-right">
                                                        {getCurrency(ano.symbol)}{ano.price?.toFixed(2)}
                                                    </p>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col h-full">
                            <div className="flex-1 flex flex-col items-center justify-center text-gray-500 mb-8">
                                <TrendingUp size={64} className="mb-4 opacity-50" />
                                <h2 className="text-2xl font-bold text-gray-400 mb-2">Welcome to Financial Tracker</h2>
                                <p className="text-lg">Select an asset to view details</p>
                            </div>

                            {/* Global Scanner Panel at Bottom of Homepage */}
                            <div className="bg-gray-800 p-6 rounded-lg border border-purple-500/30 w-full max-w-4xl mx-auto mb-8">
                                <h3 className="text-xl font-semibold mb-4 text-purple-400 flex items-center">
                                    <TrendingUp className="mr-2" /> Global Market Scanner (Live)
                                </h3>
                                {marketAnomalies.length === 0 ? (
                                    <p className="text-gray-500">Scanning for global anomalies...</p>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {marketAnomalies.map(ano => (
                                            <div key={ano.id} className="bg-purple-900/10 border border-purple-500/20 p-4 rounded hover:bg-purple-900/20 transition-colors">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="font-bold text-white text-lg">{ano.symbol}</span>
                                                    <span className="text-xs text-purple-300 bg-purple-900/50 px-2 py-1 rounded border border-purple-500/30">{ano.type}</span>
                                                </div>
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${ano.severity === 'HIGH' ? 'bg-red-900 text-red-200 border border-red-700' : 'bg-orange-900 text-orange-200 border border-orange-700'}`}>
                                                        {ano.severity}
                                                    </span>
                                                    <span className="text-xs text-gray-500">
                                                        {new Date(ano.timestamp).toLocaleTimeString()}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-300 mb-2">{ano.message}</p>
                                                <p className="text-lg font-mono text-emerald-400 text-right">
                                                    {getCurrency(ano.symbol)}{ano.price?.toFixed(2)}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {showAddModal && <AddAssetModal onClose={() => setShowAddModal(false)} onAdd={(newAsset) => {
                setAssets([...assets, newAsset]);
                // fetch details immediately
            }} />}
        </div>
    );
}
