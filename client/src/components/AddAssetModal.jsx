import { useState } from 'react';
import api from '../api';
import { X } from 'lucide-react';

export default function AddAssetModal({ onClose, onAdd }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [symbol, setSymbol] = useState('');
    const [type, setType] = useState('CRYPTO');
    const [name, setName] = useState('');

    const getFilteredList = () => {
        const list = getAssetList();
        if (!searchQuery) return list;
        return list.filter(item =>
            item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.symbol || item.id).toLowerCase().includes(searchQuery.toLowerCase())
        );
    };

    const handleSelect = (val) => {
        setSymbol(val);
        const list = getAssetList();
        const item = list.find(i => (i.id || i.symbol) === val);
        if (item) setName(item.name);
        setSearchQuery(''); // Clear search on select to look clean? Or keep it? Let's clear visual clutter but maybe keep text? Actually clearing is better for UI.
    };



    const [isCustom, setIsCustom] = useState(false);

    const POPULAR_CRYPTO = [
        { id: 'bitcoin', name: 'Bitcoin (BTC)' },
        { id: 'ethereum', name: 'Ethereum (ETH)' },
        { id: 'ripple', name: 'XRP (XRP)' },
        { id: 'solana', name: 'Solana (SOL)' },
        { id: 'cardano', name: 'Cardano (ADA)' },
        { id: 'dogecoin', name: 'Dogecoin (DOGE)' },
        { id: 'chainlink', name: 'Chainlink (LINK)' },
        { id: 'polkadot', name: 'Polkadot (DOT)' },
    ];

    const POPULAR_STOCKS = [
        { symbol: 'AAPL', name: 'Apple Inc.' },
        { symbol: 'MSFT', name: 'Microsoft Corp.' },
        { symbol: 'GOOGL', name: 'Alphabet Inc.' },
        { symbol: 'AMZN', name: 'Amazon.com' },
        { symbol: 'NVDA', name: 'NVIDIA Corp' },
        { symbol: 'TSLA', name: 'Tesla Inc.' },
        { symbol: 'META', name: 'Meta Platforms' },
        { symbol: 'NFLX', name: 'Netflix' },
    ];

    const POPULAR_INDIAN_STOCKS = [
        { symbol: 'RELIANCE.NS', name: 'Reliance Industries' },
        { symbol: 'TCS.NS', name: 'Tata Consultancy Services' },
        { symbol: 'HDFCBANK.NS', name: 'HDFC Bank' },
        { symbol: 'INFY.NS', name: 'Infosys' },
        { symbol: 'ICICIBANK.NS', name: 'ICICI Bank' },
        { symbol: 'HINDUNILVR.NS', name: 'Hindustan Unilever' },
        { symbol: 'SBIN.NS', name: 'State Bank of India' },
        { symbol: 'BHARTIARTL.NS', name: 'Bharti Airtel' },
        { symbol: 'ITC.NS', name: 'ITC Ltd' },
        { symbol: 'KOTAKBANK.NS', name: 'Kotak Mahindra Bank' },
    ];

    const POPULAR_COMMODITIES = [
        { symbol: 'GOLDBEES.NS', name: 'Gold (Nippon ETF)' },
        { symbol: 'SILVERBEES.NS', name: 'Silver (Nippon ETF)' },
        { symbol: 'HINDCOPPER.NS', name: 'Copper (Hindustan Copper)' },
        { symbol: 'ONGC.NS', name: 'Crude Oil Proxy (ONGC)' },
        { symbol: 'USO', name: 'US Oil Fund (Global Proxy)' }
    ];

    const getAssetList = () => {
        if (type === 'CRYPTO') return POPULAR_CRYPTO;
        if (type === 'INDIAN_STOCK') return POPULAR_INDIAN_STOCKS;
        if (type === 'COMMODITY') return POPULAR_COMMODITIES;
        return POPULAR_STOCKS;
    };

    const handleSelectChange = (e) => {
        const val = e.target.value;
        if (val === 'CUSTOM') {
            setIsCustom(true);
            setSymbol('');
            setName('');
        } else {
            setIsCustom(false);
            setSymbol(val);
            // Find name
            const list = getAssetList();
            const item = list.find(i => (i.id || i.symbol) === val);
            if (item) setName(item.name);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Map INDIAN_STOCK and COMMODITY back to STOCK for backend (since they are tickers)
            // Unless it's Crypto, everything else uses the Stock/PriceFetcher logic
            let backendType = 'STOCK';
            if (type === 'CRYPTO') backendType = 'CRYPTO';

            const res = await api.post('/assets', { symbol: symbol.toUpperCase(), type: backendType, name });
            onAdd(res.data);
            onClose();
        } catch (err) {
            alert('Error adding asset: ' + (err.response?.data?.message || err.message));
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
            <div className="bg-gray-800 p-6 rounded-lg w-full max-w-md border border-gray-700 relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
                    <X size={24} />
                </button>
                <h2 className="text-xl font-bold text-white mb-4">Add New Asset</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-gray-400 mb-1">Type</label>
                        <select
                            className="w-full bg-gray-900 border border-gray-700 p-2 rounded text-white"
                            value={type}
                            onChange={e => {
                                setType(e.target.value);
                                setIsCustom(false);
                                setSymbol('');
                                setName('');
                            }}
                        >
                            <option value="CRYPTO">Crypto</option>
                            <option value="STOCK">US Stocks (Finnhub)</option>
                            <option value="INDIAN_STOCK">Indian Stocks (NSE)</option>
                            <option value="COMMODITY">Commodities (ETFs/Proxies)</option>
                        </select>
                    </div>

                    {!isCustom ? (
                        <div>
                            <label className="block text-gray-400 mb-1">Search Asset</label>
                            <input
                                className="w-full bg-gray-900 border border-gray-700 p-2 rounded text-white mb-2 focus:border-emerald-500 focus:outline-none"
                                placeholder="Search by name or symbol..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />

                            <div className="max-h-40 overflow-y-auto border border-gray-700 rounded bg-gray-900 absolute w-full left-0 z-10 shadow-lg">
                                {getFilteredList().length > 0 ? (
                                    getFilteredList().map(item => (
                                        <div
                                            key={item.id || item.symbol}
                                            onClick={() => handleSelect(item.id || item.symbol)}
                                            className="p-2 hover:bg-emerald-600 cursor-pointer text-white border-b border-gray-800 last:border-none"
                                        >
                                            <span className="font-bold mr-2">{item.symbol || item.id.toUpperCase()}</span>
                                            <span className="text-gray-400 text-sm">{item.name}</span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-2 text-gray-500">No results found.</div>
                                )}
                                <div
                                    onClick={() => { setIsCustom(true); setSymbol(''); setName(''); }}
                                    className="p-2 bg-gray-800 hover:bg-gray-700 cursor-pointer text-emerald-400 font-semibold border-t border-gray-700"
                                >
                                    + Add Custom Asset Manually
                                </div>
                            </div>

                            {/* Hidden select for compatibility or just visual feedback of selection */}
                            {symbol && (
                                <div className="mt-2 p-2 bg-emerald-900/30 border border-emerald-500/50 rounded text-emerald-200">
                                    Selected: <b>{symbol}</b>
                                </div>
                            )}
                        </div>
                    ) : (
                        <>
                            <div>
                                <label className="block text-gray-400 mb-1">Symbol / ID</label>
                                <p className="text-xs text-gray-500 mb-1">
                                    {type === 'CRYPTO' ? 'Use CoinGecko ID (e.g. bitcoin)' : 'Use Ticker (e.g. AAPL, RELIANCE.NS)'}
                                </p>
                                <input
                                    className="w-full bg-gray-900 border border-gray-700 p-2 rounded text-white"
                                    value={symbol}
                                    onChange={e => setSymbol(e.target.value)}
                                    placeholder={type === 'CRYPTO' ? "bitcoin" : "RELIANCE.NS"}
                                    required
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="block text-gray-400 mb-1">Display Name</label>
                                <input
                                    className="w-full bg-gray-900 border border-gray-700 p-2 rounded text-white"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    placeholder="My Asset"
                                    required
                                />
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsCustom(false)}
                                className="text-sm text-emerald-400 underline"
                            >
                                Back to list
                            </button>
                        </>
                    )}

                    <button className="w-full bg-emerald-600 hover:bg-emerald-700 p-2 mt-4 rounded font-bold text-white">
                        Add Asset
                    </button>
                </form>
            </div>
        </div>
    );
}
