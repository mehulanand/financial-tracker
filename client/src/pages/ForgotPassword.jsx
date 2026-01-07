import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import { Lock, Mail, ArrowRight } from 'lucide-react';

export default function ForgotPassword() {
    const [step, setStep] = useState(1); // 1: Email, 2: OTP + New Password
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleRequestOTP = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');
        try {
            await api.post('/auth/forgot-password', { email });
            setStep(2);
            setMessage('OTP sent to your email.');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await api.post('/auth/reset-password', { email, otp, newPassword });
            setMessage('Password reset successful! Redirecting...');
            setTimeout(() => navigate('/login'), 2000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to reset password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-900">
            <div className="w-full max-w-md p-8 bg-gray-800 rounded-lg shadow-xl border border-gray-700">
                <h2 className="text-2xl font-bold text-center text-white mb-6">
                    {step === 1 ? 'Forgot Password?' : 'Reset Password'}
                </h2>

                {error && <div className="bg-red-500/20 text-red-500 p-3 rounded mb-4 text-center">{error}</div>}
                {message && <div className="bg-emerald-500/20 text-emerald-500 p-3 rounded mb-4 text-center">{message}</div>}

                {step === 1 ? (
                    <form onSubmit={handleRequestOTP} className="space-y-6">
                        <p className="text-gray-400 text-center text-sm">
                            Enter your email validation code will be sent to you.
                        </p>
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
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-lg transition-all flex items-center justify-center space-x-2"
                        >
                            {loading ? <span>Sending...</span> : <><span>Send OTP</span> <ArrowRight size={18} /></>}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleResetPassword} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">OTP Code</label>
                            <input
                                type="text"
                                className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg p-3 text-center tracking-widest text-xl focus:border-emerald-500 focus:outline-none"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                placeholder="123456"
                                maxLength={6}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">New Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
                                <input
                                    type="password"
                                    className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg p-3 pl-10 focus:border-emerald-500 focus:outline-none"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-lg transition-all"
                        >
                            {loading ? 'Resetting...' : 'Reset Password'}
                        </button>
                    </form>
                )}

                <div className="mt-6 text-center">
                    <Link to="/login" className="text-gray-400 hover:text-white text-sm">
                        Back to Login
                    </Link>
                </div>
            </div>
        </div>
    );
}
