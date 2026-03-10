import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebase';
import { useNavigate } from 'react-router-dom';
import emailjs from '@emailjs/browser';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [otpCode, setOtpCode] = useState('');
    const [generatedOtp, setGeneratedOtp] = useState(null);
    const [step, setStep] = useState(1); // 1 = Creds, 2 = OTP

    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // Allowed Admins
    const ALLOWED_EMAILS = ['bhimayafoods@gmail.com', 'ssaiprasanth333@gmail.com'];

    const handleInitialLogin = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');

        if (!ALLOWED_EMAILS.includes(email.toLowerCase().trim())) {
            setError("Unauthorized email address.");
            return;
        }

        setLoading(true);
        try {
            // Very critical: We DO NOT log them in yet. 
            // BUT we dry-run the auth to ensure their password is correct.
            // If it succeeds, we instantly sign them out so they are forced to do the OTP.
            await signInWithEmailAndPassword(auth, email, password);
            await auth.signOut();

            // Generate a 6-digit OTP
            const code = Math.floor(100000 + Math.random() * 900000).toString();
            setGeneratedOtp(code);

            // Send via EmailJS
            const templateParams = {
                email: email, // This must match the {{email}} variable in the EmailJS dashboard
                otp_code: code,
            };

            await emailjs.send(
                'service_qwdsdli',
                'template_ws3rv3h',
                templateParams,
                '5LEFcXjQwYbESiDow'
            );

            setMessage('Verification code sent to your email.');
            setStep(2);

        } catch (err) {
            console.error("Login verification error:", err);
            if (err.code) {
                setError(`Firebase Auth Error: ${err.message}`);
            } else if (err.text) {
                setError(`EmailJS Error: ${err.text}`);
            } else {
                setError(`Unknown Error: ${err.message || JSON.stringify(err)}`);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (otpCode === generatedOtp) {
            try {
                // Now we officially log them in 
                await signInWithEmailAndPassword(auth, email, password);
                navigate('/admin');
            } catch (err) {
                console.error("Final login error:", err);
                setError('Failed to authenticate your session.');
            }
        } else {
            setError('Incorrect verification code. Please try again.');
        }
        setLoading(false);
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="bg-white p-8 rounded shadow-md w-full max-w-sm">
                <h2 className="text-2xl font-bold mb-6 text-center text-orange-600">Admin Login</h2>

                {error && <div className="bg-red-50 text-red-500 p-3 mb-4 rounded text-sm font-semibold border border-red-100">{error}</div>}
                {message && <div className="bg-green-50 text-green-600 p-3 mb-4 rounded text-sm font-semibold border border-green-100">{message}</div>}

                {step === 1 ? (
                    <form onSubmit={handleInitialLogin} className="space-y-4">
                        <div>
                            <label className="block text-gray-700 text-sm font-bold mb-2">Email</label>
                            <input
                                type="email"
                                className="w-full mt-1 p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="owner@example.com"
                            />
                        </div>

                        <div>
                            <label className="block text-gray-700 text-sm font-bold mb-2">Password</label>
                            <input
                                type="password"
                                className="w-full mt-1 p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                                value={password}
                                placeholder="Enter your password"
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        <div className="mt-6">
                            <button
                                type="submit"
                                disabled={loading || !email || !password}
                                className="w-full bg-orange-600 text-white p-3 rounded-lg font-bold hover:bg-orange-700 transition disabled:opacity-50"
                            >
                                {loading ? 'Verifying...' : 'Login & Get Code'}
                            </button>
                        </div>
                    </form>
                ) : (
                    <form onSubmit={handleVerifyOtp} className="space-y-4">
                        <p className="text-gray-600 text-sm text-center mb-4">
                            We've sent a 6-digit code to <span className="font-bold">{email}</span>.
                        </p>
                        <div>
                            <label className="block text-gray-700 text-sm font-bold mb-2">6-Digit OTP Code</label>
                            <input
                                type="text"
                                maxLength="6"
                                className="w-full mt-1 p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500 text-center text-2xl tracking-widest"
                                value={otpCode}
                                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))} // only numbers
                                required
                                placeholder="000000"
                            />
                        </div>

                        <div className="mt-6 space-y-3">
                            <button
                                type="submit"
                                disabled={loading || otpCode.length !== 6}
                                className="w-full bg-green-600 text-white p-3 rounded-lg font-bold hover:bg-green-700 transition disabled:opacity-50"
                            >
                                {loading ? 'Authenticating...' : 'Verify & Log In'}
                            </button>

                            <button
                                type="button"
                                onClick={() => { setStep(1); setOtpCode(''); setGeneratedOtp(null); setMessage(''); setError(''); }}
                                className="w-full text-orange-600 text-sm hover:underline mt-2"
                            >
                                Cancel & go back
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default Login;
