import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, User, Facebook, Loader2 } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser, reset } from '../store/slices/authSlice';

const Register = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        agreeToTerms: false
    });

    const navigate = useNavigate();
    const dispatch = useDispatch();

    const { user, isLoading, isError, isSuccess, message } = useSelector(
        (state) => state.auth
    );

    useEffect(() => {
        if (isError) {
            console.error(message);
        }

        if (isSuccess || user) {
            navigate('/');
        }

        dispatch(reset());
    }, [user, isError, isSuccess, message, navigate, dispatch]);

    const handleSubmit = (e) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            alert('Passwords do not match');
            return;
        }

        const userData = {
            name: formData.name,
            email: formData.email,
            password: formData.password,
        };

        dispatch(registerUser(userData));
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-bg p-4 font-sans">
            <div className="w-full max-w-md space-y-8 bg-panel p-8 rounded-2xl shadow-xl border border-white/5">
                {/* Header */}
                <div className="text-center">
                    <div className="flex justify-center mb-6">
                        <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center text-white text-2xl font-bold">▶</div>
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-2">Create an Account</h2>
                    <p className="text-gray-400">Join our community! Fill in the details below:</p>
                </div>

                {/* Social Register */}
                <div className="grid grid-cols-2 gap-4">
                    <button className="flex items-center justify-center gap-2 py-2.5 border border-white/10 rounded-xl hover:bg-white/5 transition-all text-white font-medium">
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="#EA4335" d="M12 5.04c1.94 0 3.7.67 5.07 1.99l3.8-3.79C18.57 1.27 15.53 0 12 0 7.33 0 3.32 2.67 1.28 6.57l4.41 3.42C6.73 7.08 9.14 5.04 12 5.04z" />
                            <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.21-2.35H12v4.45h6.44c-.28 1.47-1.11 2.71-2.36 3.55l4.42 3.43c2.58-2.38 4.07-5.88 4.07-9.08z" />
                            <path fill="#FBBC05" d="M5.69 14.71c-.24-.71-.38-1.47-.38-2.27s.14-1.56.38-2.27L1.28 6.57C.47 8.16 0 9.97 0 12s.47 3.84 1.28 5.43l4.41-3.42z" />
                            <path fill="#34A853" d="M12 24c3.24 0 5.95-1.07 7.94-2.91l-4.42-3.43c-1.1.74-2.51 1.18-3.52 1.18-2.86 0-5.27-2.04-6.14-4.79L1.28 17.43C3.32 21.33 7.33 24 12 24z" />
                        </svg>
                        Google
                    </button>
                    <button className="flex items-center justify-center gap-2 py-2.5 border border-white/10 rounded-xl hover:bg-white/5 transition-all text-white font-medium">
                        <Facebook className="w-5 h-5 text-[#1877F2] fill-[#1877F2]" />
                        Facebook
                    </button>
                </div>

                {/* Divider */}
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-white/10"></div>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-panel px-4 text-gray-500">or register with email</span>
                    </div>
                </div>

                {/* Form */}
                <form className="space-y-4" onSubmit={handleSubmit}>
                    <div className="space-y-3">
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                            <input
                                type="text"
                                placeholder="Full Name"
                                className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all font-sans"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>

                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                            <input
                                type="email"
                                placeholder="Email Address"
                                className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all font-sans"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                            />
                        </div>

                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="Password"
                                className="w-full pl-11 pr-11 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all font-sans"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                required
                            />
                            <button
                                type="button"
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>

                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="Confirm Password"
                                className="w-full pl-11 pr-11 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all font-sans"
                                value={formData.confirmPassword}
                                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2 px-1">
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <div className="relative">
                                <input
                                    type="checkbox"
                                    className="peer hidden"
                                    checked={formData.agreeToTerms}
                                    onChange={(e) => setFormData({ ...formData, agreeToTerms: e.target.checked })}
                                    required
                                />
                                <div className="w-4 h-4 border-2 border-white/10 rounded peer-checked:bg-accent peer-checked:border-accent transition-all flex items-center justify-center">
                                    <svg className="w-2.5 h-2.5 text-white scale-0 peer-checked:scale-100 transition-all" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                </div>
                            </div>
                            <span className="text-xs text-gray-400 group-hover:text-gray-300 transition-colors">
                                I agree to the <Link to="/terms" className="text-accent hover:underline">Terms & Conditions</Link>
                            </span>
                        </label>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3.5 bg-accent hover:bg-accent hover:brightness-110 text-white font-bold rounded-xl transition-all shadow-lg shadow-accent/20 active:scale-[0.98] mt-2 flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Signing Up...
                            </>
                        ) : (
                            'Sign Up'
                        )}
                    </button>
                </form>

                {/* Footer */}
                <p className="text-center text-gray-400 text-sm">
                    Already have an account?{' '}
                    <Link to="/login" className="text-accent font-bold hover:text-accent/80 transition-colors">
                        Log in
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Register;
