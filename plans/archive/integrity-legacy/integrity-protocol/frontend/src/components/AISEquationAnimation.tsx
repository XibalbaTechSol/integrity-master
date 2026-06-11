import React, { useEffect, useState } from 'react';
import { motion, useAnimation, AnimatePresence } from 'framer-motion';
import Latex from 'react-latex-next';
import { Shield, Zap, Target, Activity, Coins, Clock } from 'lucide-react';

const EquationPart = ({ children, label, delay = 0, color = "var(--gold)" }: { children: React.ReactNode, label: string, delay?: number, color?: string }) => (
    <motion.div
        initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ duration: 0.8, delay, ease: "easeOut" }}
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}
    >
        <div style={{ 
            fontSize: '2.5rem', 
            fontWeight: 800, 
            color: 'white', 
            fontFamily: 'JetBrains Mono, monospace',
            textShadow: `0 0 20px ${color}40`
        }}>
            {children}
        </div>
        <div style={{ 
            fontSize: '0.6rem', 
            fontWeight: 900, 
            color: 'rgba(255,255,255,0.4)', 
            textTransform: 'uppercase', 
            letterSpacing: '0.3em',
            background: 'rgba(255,255,255,0.03)',
            padding: '4px 12px',
            borderRadius: '4px',
            border: '1px solid rgba(255,255,255,0.05)'
        }}>
            {label}
        </div>
    </motion.div>
);

export const AISEquationAnimation = () => {
    const controls = useAnimation();
    const [step, setStep] = useState(0);

    useEffect(() => {
        const sequence = async () => {
            await new Promise(resolve => setTimeout(resolve, 1000));
            setStep(1);
            await new Promise(resolve => setTimeout(resolve, 2000));
            setStep(2);
            await new Promise(resolve => setTimeout(resolve, 2000));
            setStep(3);
            await new Promise(resolve => setTimeout(resolve, 2000));
            setStep(4);
        };
        sequence();
    }, []);

    return (
        <div style={{ 
            position: 'relative', 
            width: '100%', 
            height: '500px', 
            background: 'radial-gradient(circle at center, rgba(212, 175, 55, 0.08) 0%, transparent 70%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            borderRadius: '40px',
            border: '1px solid rgba(212, 175, 55, 0.1)'
        }}>
            {/* Cinematic Background Particles */}
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                {[...Array(20)].map((_, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0 }}
                        animate={{ 
                            opacity: [0.1, 0.3, 0.1],
                            y: [0, -100],
                            x: [0, (i % 2 === 0 ? 50 : -50)]
                        }}
                        transition={{ 
                            duration: 4 + Math.random() * 4, 
                            repeat: Infinity,
                            delay: Math.random() * 5
                        }}
                        style={{ 
                            position: 'absolute',
                            left: `${Math.random() * 100}%`,
                            bottom: '-20px',
                            width: '2px',
                            height: '2px',
                            background: 'var(--gold)',
                            borderRadius: '50%',
                            boxShadow: '0 0 10px var(--gold)'
                        }}
                    />
                ))}
            </div>

            {/* Main Equation Container */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px', zIndex: 10 }}>
                <EquationPart label="INTEGRITY SCORE" color="var(--gold)">
                    <Latex>$AIS(t)$</Latex>
                </EquationPart>

                <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 }}
                    style={{ fontSize: '2rem', color: 'rgba(255,255,255,0.2)', fontWeight: 300 }}
                >
                    =
                </motion.div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1 }}
                        style={{ fontSize: '1.2rem', color: 'var(--gold)', fontWeight: 800, fontFamily: 'JetBrains Mono, monospace' }}
                    >
                        min
                    </motion.div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', padding: '32px', background: 'rgba(255,255,255,0.02)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)', position: 'relative' }}>
                        
                        {/* Brackets */}
                        <div style={{ position: 'absolute', left: '12px', top: '20px', bottom: '20px', width: '2px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px' }} />
                        <div style={{ position: 'absolute', right: '12px', top: '20px', bottom: '20px', width: '2px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px' }} />

                        <EquationPart label="VERIFICATION CAP" delay={1.2} color="#f43f5e">
                            <Latex>$TierCap$</Latex>
                        </EquationPart>

                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1.5 }}
                            style={{ alignSelf: 'center', fontSize: '1.5rem', color: 'rgba(255,255,255,0.2)' }}
                        >
                            ,
                        </motion.div>

                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                                <EquationPart label="TRI-METRIC AGGREGATE" delay={1.8} color="#60a5fa">
                                    <Latex>$\left[\sum w_i \cdot Metric_i\right]$</Latex>
                                </EquationPart>
                                
                                {/* Pulse Indicator for Metrics */}
                                <AnimatePresence>
                                    {step >= 2 && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0 }}
                                            style={{ display: 'flex', gap: '12px', marginTop: '12px' }}
                                        >
                                            <Activity size={14} color="#10b981" />
                                            <Target size={14} color="#60a5fa" />
                                            <Coins size={14} color="var(--gold)" />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            <motion.div 
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 2.2 }}
                                style={{ fontSize: '1.2rem', color: 'rgba(255,255,255,0.2)' }}
                            >
                                ×
                            </motion.div>

                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                                <EquationPart label="TEMPORAL DECAY" delay={2.5} color="#a78bfa">
                                    <Latex>$D(\Delta t)$</Latex>
                                </EquationPart>
                                <AnimatePresence>
                                    {step >= 3 && (
                                        <motion.div
                                            initial={{ opacity: 0, rotate: -90 }}
                                            animate={{ opacity: 1, rotate: 0 }}
                                            style={{ marginTop: '12px' }}
                                        >
                                            <Clock size={16} color="#a78bfa" />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Dynamic Status Bar */}
            <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: '80%', opacity: 1 }}
                transition={{ duration: 1.5, delay: 3 }}
                style={{ 
                    marginTop: '60px', 
                    height: '1px', 
                    background: 'linear-gradient(90deg, transparent 0%, var(--gold) 50%, transparent 100%)',
                    position: 'relative'
                }}
            >
                <motion.div
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    style={{ 
                        position: 'absolute', top: '-1px', left: 0, width: '40px', height: '3px', 
                        background: 'var(--gold)', filter: 'blur(4px)' 
                    }}
                />
            </motion.div>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 3.5 }}
                style={{ marginTop: '24px', display: 'flex', gap: '40px' }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.7rem', fontWeight: 800, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em' }}>
                    <Shield size={12} /> DETERMINISTIC BOUNDS
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.7rem', fontWeight: 800, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em' }}>
                    <Activity size={12} /> STOCHASTIC INPUTS
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.7rem', fontWeight: 800, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em' }}>
                    <Clock size={12} /> TEMPORAL FINALITY
                </div>
            </motion.div>
        </div>
    );
};
