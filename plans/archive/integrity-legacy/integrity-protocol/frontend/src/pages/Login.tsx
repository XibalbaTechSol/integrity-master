import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { ShieldCheck, Lock, ChevronRight, Github, Mail } from 'lucide-react';
import { auth, googleProvider, githubProvider } from '../firebase';
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { API_BASE } from '../constants';

export const Login = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [isRegistering, setIsRegistering] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [handle, setHandle] = useState('');
    const [error, setError] = useState('');

    const handleEmailAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        
        // Xibalba Sovereign Account Bypass
        const isMasterEmail = email.toLowerCase() === 'xibalbasolutions@gmail.com';
        const isMasterPass = password === 'Holl@2026';
        
        // Demo Account Bypass
        const isDemoLogin = email.toLowerCase() === 'demo' && password === 'demo';

        if ((isMasterEmail && isMasterPass) || isDemoLogin) {
            localStorage.clear();
            localStorage.setItem('integrity_demo_mode', 'false');
            if (isMasterEmail) {
                localStorage.setItem('integrity_user_handle', 'xibalba');
                localStorage.setItem('integrity_master_email', email.toLowerCase());
                localStorage.setItem('integrity_mock_token', 'master_agent_token'); 
            } else {
                localStorage.setItem('integrity_user_handle', 'demo_sovereign');
                localStorage.setItem('integrity_mock_token', 'mock_demo_token');
            }
            navigate('/dashboard');
            setIsLoading(false);
            return;
        }

        try {
            if (isRegistering) {
                const userCred = await createUserWithEmailAndPassword(auth, email, password);
                
                // Sync handle with backend profile
                if (handle) {
                    const token = await userCred.user.getIdToken();
                    await axios.post(`${API_BASE}/v1/identity/profile`, { handle }, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                }
                
                navigate('/dashboard?onboarding=true');
            } else {
                await signInWithEmailAndPassword(auth, email, password);
                navigate('/dashboard');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSocialLogin = async (provider: any) => {
        setIsLoading(true);
        setError('');
        try {
            await signInWithPopup(auth, provider);
            navigate('/dashboard');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="login-page" style={{ background: 'var(--navy-deep)', color: 'white', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '20%', left: '10%', width: '30%', height: '50%', background: 'var(--gold)', filter: 'blur(160px)', borderRadius: '50%', opacity: 0.1 }}></div>
            
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{ width: '100%', maxWidth: '440px', padding: '60px', background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '40px', zIndex: 10, boxShadow: '0 40px 100px rgba(0,0,0,0.5)' }}
            >
                <div style={{ textAlign: 'center', marginBottom: '48px' }}>
                    <img 
                        src="https://xibalbatechsol.github.io/xibalba-solutions-site/XibalbaSolutionsLogo.png" 
                        alt="Xibalba" 
                        style={{ height: '80px', width: 'auto', margin: '0 auto 24px', display: 'block', filter: 'drop-shadow(0 0 20px rgba(201, 168, 76, 0.2))' }} 
                    />
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '0.1em', marginBottom: '8px' }}>XIBALBA <span style={{ color: 'var(--gold)', fontWeight: 400 }}>TRUST</span></h1>
                    <p style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.3em' }}>Institutional Gateway</p>
                </div>

                <form onSubmit={handleEmailAuth} style={{ display: 'flex', flexDirection: 'column' as const, gap: '20px' }}>
                    {isRegistering && (
                        <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            style={{ display: 'flex', flexDirection: 'column' as const, gap: '8px' }}
                        >
                            <label style={{ fontSize: '0.6rem', fontWeight: 900, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Sovereign Handle</label>
                            <div style={{ position: 'relative' }}>
                                <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', fontWeight: 800 }}>@</span>
                                <input 
                                    type="text" 
                                    placeholder="your_handle" 
                                    required
                                    value={handle}
                                    onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
                                    style={{ width: '100%', padding: '16px 16px 16px 40px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--gold)', borderRadius: '12px', color: 'white', fontSize: '0.9rem', outline: 'none' }}
                                />
                            </div>
                        </motion.div>
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '8px' }}>
                        <label style={{ fontSize: '0.6rem', fontWeight: 900, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Email Identity</label>
                        <input 
                            type="text" 
                            placeholder="agent@xibalba.solutions or DEMO" 
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white', fontSize: '0.9rem', outline: 'none' }}
                        />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '8px' }}>
                        <label style={{ fontSize: '0.6rem', fontWeight: 900, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Access Key</label>
                        <input 
                            type="password" 
                            placeholder="••••••••" 
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white', fontSize: '0.9rem', outline: 'none' }}
                        />
                    </div>

                    {error && <p style={{ fontSize: '0.75rem', color: '#f43f5e', textAlign: 'center', margin: 0 }}>{error}</p>}

                    <button 
                        type="submit" 
                        disabled={isLoading}
                        className="btn btn-primary" 
                        style={{ padding: '16px', fontSize: '0.85rem', marginTop: '12px' }}
                    >
                        {isLoading ? 'Processing...' : isRegistering ? 'Initialize Agent Account' : 'Authenticate Identity'}
                    </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: '24px' }}>
                    <button 
                        onClick={() => setIsRegistering(!isRegistering)}
                        style={{ background: 'none', border: 'none', color: 'var(--gold)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                    >
                        {isRegistering ? 'Already have an account? Sign In' : 'Need an institutional account? Register'}
                    </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', margin: '32px 0' }}>
                    <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
                    <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)', fontWeight: 900 }}>SOCIAL GATEWAYS</span>
                    <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                    <button 
                        onClick={() => handleSocialLogin(googleProvider)}
                        style={{ padding: '12px', background: 'white', color: 'var(--navy-deep)', border: 'none', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}
                    >
                        <Mail size={16} /> Google
                    </button>
                    <button 
                        onClick={() => handleSocialLogin(githubProvider)}
                        style={{ padding: '12px', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}
                    >
                        <Github size={16} /> GitHub
                    </button>
                </div>

                <button 
                    onClick={() => {
                        const guestId = `guest_${Math.random().toString(36).substring(2, 9)}`;
                        localStorage.setItem('integrity_demo_mode', 'false');
                        localStorage.setItem('integrity_mock_token', guestId);
                        navigate('/dashboard?guest=true');
                    }}
                    className="btn"
                    style={{ width: '100%', padding: '16px', background: 'rgba(212, 175, 55, 0.1)', border: '1px solid var(--gold)', borderRadius: '12px', color: 'var(--gold)', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
                >
                    Guest Mode (Real Testnet Wallet & 10,000 ITK)
                </button>
            </motion.div>
        </div>
    );
};
