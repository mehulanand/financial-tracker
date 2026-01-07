import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail } from 'lucide-react';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/auth/login', { email, password });
            login(res.data.user, res.data.token);
            navigate('/');
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || err.response?.data?.error || 'Login failed');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-900">
            <div className="w-full max-w-md p-8 bg-gray-800 rounded-lg shadow-xl border border-gray-700">
                <h2 className="text-3xl font-bold text-center text-emerald-400 mb-8">Asset Tracker</h2>
                {error && <div className="bg-red-500/20 text-red-500 p-3 rounded mb-4 text-center">{error}</div>}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Email</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
                            <input
                                type="email"
                                className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg p-3 pl-10 focus:border-emerald-500 focus:outline-none"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
                            <input
                                type="password"
                                className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg p-3 pl-10 focus:border-emerald-500 focus:outline-none"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                    <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-lg transition-all shadow-lg shadow-emerald-900/50">
                        Sign In
                    </button>
                </form>
                <div className="mt-6 text-center space-y-2">
                    <div>
                        <Link to="/forgot-password" className="text-gray-400 hover:text-white text-sm">Forgot Password?</Link>
                    </div>
                    <div className="text-gray-400">
                        Don't have an account? <Link to="/signup" className="text-emerald-400 hover:underline">Sign up</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
