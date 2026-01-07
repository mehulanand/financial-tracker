import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import { Mail, Lock, ShieldCheck } from 'lucide-react';

export default function Signup() {
    const [step, setStep] = useState(1); // 1: Signup, 2: OTP
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSignup = async (e) => {
        e.preventDefault();
        try {
            await api.post('/auth/signup', { email, password });
            setStep(2);
            setError('');
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || err.response?.data?.error || 'Signup failed');
        }
    };

    const handleVerify = async (e) => {
        e.preventDefault();
        try {
            await api.post('/auth/verify-otp', { email, otp });
            navigate('/login');
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || err.response?.data?.error || 'Verification failed');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-900">
            <div className="w-full max-w-md p-8 bg-gray-800 rounded-lg shadow-xl border border-gray-700">
                <h2 className="text-3xl font-bold text-center text-emerald-400 mb-8">
                    {step === 1 ? 'Create Account' : 'Verify Email'}
                </h2>
                {error && <div className="bg-red-500/20 text-red-500 p-3 rounded mb-4 text-center">{error}</div>}

                {step === 1 ? (
                    <form onSubmit={handleSignup} className="space-y-6">
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
                            Send OTP
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleVerify} className="space-y-6">
                        <div className="text-center text-gray-400 mb-4">
                            We sent a code to <span className="text-white">{email}</span>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Enter OTP</label>
                            <div className="relative">
                                <ShieldCheck className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
                                <input
                                    type="text"
                                    className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg p-3 pl-10 focus:border-emerald-500 focus:outline-none tracking-widest text-center text-xl"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    required
                                    maxLength={6}
                                />
                            </div>
                        </div>
                        <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-lg transition-all shadow-lg shadow-emerald-900/50">
                            Verify & Signup
                        </button>
                    </form>
                )}

                <div className="mt-6 text-center text-gray-400">
                    Already have an account? <Link to="/login" className="text-emerald-400 hover:underline">Log in</Link>
                </div>
            </div>
        </div>
    );
}
