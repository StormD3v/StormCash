import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Zap, ShieldCheck, ArrowRight, Menu, X,
    Wallet, Globe, Lock, BarChart3, ArrowLeftRight,
    Database, Check, Layers, Clock, Eye
} from 'lucide-react';

const APP_SHOT = 'https://images.hostinger.com/a7d73a97-49b4-4cb8-bad2-e8c552829bea.png';
const STORM_BG = 'https://images.hostinger.com/b477bcbc-972b-446e-b16c-4c5c348a0fc5.png';

const fadeUp = {
    hidden: { opacity: 0, y: 24 },
    show: (i = 0) => ({
        opacity: 1, y: 0,
        transition: { duration: 0.55, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }
    })
};

// ── Header ────────────────────────────────────────────────────────────────────
const Header = () => {
    const [open, setOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    return (
        <header className={`fixed top-0 inset-x-0 z-50 transition-colors duration-300 ${scrolled ? 'bg-[#080814]/90 backdrop-blur-xl border-b border-white/5' : 'bg-transparent'}`}>
            <div className="mx-auto max-w-[80rem] px-5 sm:px-8 h-16 flex items-center justify-between">
                {/* Logo */}
                <a href="#top" className="flex items-center gap-2 text-white font-display font-bold text-lg tracking-tight">
                    <span className="grid place-items-center w-8 h-8 rounded-lg bg-sky-400 text-[#080814]">
                        <Zap className="w-5 h-5" strokeWidth={2.5} fill="currentColor" />
                    </span>
                    StormCash
                </a>

                {/* Desktop nav */}
                <nav className="hidden md:flex items-center gap-8 text-sm text-white/60">
                    <a href="#features" className="hover:text-white transition-colors">Features</a>
                    <a href="#architecture" className="hover:text-white transition-colors">Architecture</a>
                    <a href="#status" className="hover:text-white transition-colors">Status</a>
                </nav>

                {/* Desktop CTAs */}
                <div className="hidden md:flex items-center gap-3">
                    <Link to="/login" className="text-sm text-white/70 hover:text-white transition-colors">
                        Sign in
                    </Link>
                    <Link to="/register" className="text-sm font-semibold text-[#080814] bg-sky-400 hover:bg-sky-300 transition-colors px-4 py-2 rounded-lg">
                        Open account
                    </Link>
                </div>

                {/* Mobile menu toggle */}
                <button className="md:hidden text-white" onClick={() => setOpen(!open)} aria-label="Menu">
                    {open ? <X /> : <Menu />}
                </button>
            </div>

            {/* Mobile menu */}
            {open && (
                <div className="md:hidden bg-[#080814] border-t border-white/5 px-5 py-4 flex flex-col gap-4 text-white/80">
                    <a href="#features" onClick={() => setOpen(false)}>Features</a>
                    <a href="#architecture" onClick={() => setOpen(false)}>Architecture</a>
                    <a href="#status" onClick={() => setOpen(false)}>Status</a>
                    <Link to="/login" onClick={() => setOpen(false)} className="text-white/70">Sign in</Link>
                    <Link to="/register" onClick={() => setOpen(false)} className="text-center font-semibold text-[#080814] bg-sky-400 px-4 py-2.5 rounded-lg">
                        Open account
                    </Link>
                </div>
            )}
        </header>
    );
};

// ── Hero ──────────────────────────────────────────────────────────────────────
const Hero = () => (
    <section id="top" className="relative min-h-[100dvh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
            <img src={STORM_BG} alt="" className="w-full h-full object-cover opacity-50" aria-hidden="true" />
            <div className="absolute inset-0 bg-gradient-to-b from-[#080814]/70 via-[#080814]/60 to-[#080814]" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#080814] via-transparent to-transparent" />
        </div>

        <div className="relative mx-auto max-w-[80rem] px-5 sm:px-8 w-full grid lg:grid-cols-2 gap-12 items-center pt-28 pb-16">
            <div>
                {/* Prototype context pill */}
                <motion.div variants={fadeUp} initial="hidden" animate="show" custom={0}
                    className="inline-flex items-center gap-2 rounded-full border border-sky-400/30 bg-sky-400/10 px-3 py-1 text-xs font-medium text-sky-300 mb-6">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
                    Open prototype — v0.1.0
                </motion.div>

                <motion.h1 variants={fadeUp} initial="hidden" animate="show" custom={1}
                    className="font-display font-bold text-white text-5xl sm:text-6xl lg:text-7xl leading-[0.95] tracking-tight text-balance">
                    Settlement finality for every transfer.
                </motion.h1>

                <motion.p variants={fadeUp} initial="hidden" animate="show" custom={2}
                    className="mt-6 text-lg text-white/60 max-w-md">
                    StormCash is a working prototype exploring what payment infrastructure looks like when a transfer either completes fully or never starts — with every settlement stage visible in real time.
                </motion.p>

                <motion.div variants={fadeUp} initial="hidden" animate="show" custom={3}
                    className="mt-8 flex flex-wrap items-center gap-4">
                    <Link to="/register" className="group inline-flex items-center gap-2 font-semibold text-[#080814] bg-sky-400 hover:bg-sky-300 transition-colors px-6 py-3.5 rounded-xl">
                        Open your account
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                    <a href="#features" className="inline-flex items-center gap-2 font-medium text-white/80 hover:text-white border border-white/15 hover:border-white/30 px-6 py-3.5 rounded-xl transition-colors">
                        See what's built
                    </a>
                </motion.div>

                <motion.div variants={fadeUp} initial="hidden" animate="show" custom={4}
                    className="mt-10 flex items-center gap-6 text-sm text-white/50">
                    <span className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-sky-400" />
                        Double-entry ledger
                    </span>
                    <span className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-sky-400" />
                        Simulated blockchain settlement
                    </span>
                </motion.div>
            </div>

            {/* App screenshot */}
            <motion.div
                initial={{ opacity: 0, y: 40, rotate: 2 }}
                animate={{ opacity: 1, y: 0, rotate: 0 }}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
                className="relative hidden lg:block">
                <div className="absolute -inset-8 bg-sky-500/20 blur-3xl rounded-full" />
                <img src={APP_SHOT} alt="StormCash dashboard screenshot"
                    className="relative mx-auto w-[320px] rounded-[2.5rem] shadow-2xl shadow-sky-900/40 border border-white/10" />
            </motion.div>
        </div>
    </section>
);

// ── Ticker — only real/vision items ───────────────────────────────────────────
const tickerItems = [
    'Atomic transfers', 'Settlement visibility', 'Double-entry ledger',
    'JWT authentication', 'Race condition protection', 'Blockchain simulation',
    'Instant deposits', 'Withdrawal guards', 'Transaction explorer',
    'StormChain vision', 'Cross-currency direction', 'Real-time settlement UI',
];

const Ticker = () => (
    <div className="border-y border-white/5 bg-[#0b0b1a] py-4 overflow-hidden">
        <div className="flex w-max animate-marquee">
            {[0, 1].map((k) => (
                <div key={k} className="flex items-center" aria-hidden={k === 1}>
                    {tickerItems.map((t) => (
                        <span key={t} className="flex items-center gap-3 px-6 text-sm font-display font-medium text-white/40 whitespace-nowrap">
                            <Zap className="w-3.5 h-3.5 text-sky-400" fill="currentColor" /> {t}
                        </span>
                    ))}
                </div>
            ))}
        </div>
    </div>
);

// ── Features — only what actually exists ──────────────────────────────────────
const features = [
    {
        icon: ArrowLeftRight,
        title: 'Atomic transfers',
        desc: 'Source account is debited immediately under a row-level lock. Destination is credited only when settlement completes — no partial state.',
    },
    {
        icon: Eye,
        title: 'Live settlement visibility',
        desc: 'Every transfer progresses through 8 observable stages — from INITIATED to DEPOSITED — visible in real time in the dashboard.',
    },
    {
        icon: Database,
        title: 'Double-entry ledger',
        desc: 'No stored balance field. Balances are always computed from immutable credit and debit entries, exactly like a real bank ledger.',
    },
    {
        icon: ShieldCheck,
        title: 'Concurrency protection',
        desc: 'SELECT FOR UPDATE row locking prevents race conditions. Two simultaneous transfers cannot both overdraft the same account.',
    },
    {
        icon: BarChart3,
        title: 'Transaction explorer',
        desc: 'Inspect any transfer: blockchain hash, block number, confirmation count, gas fee, settlement timeline, and final credited amount.',
    },
    {
        icon: Lock,
        title: 'JWT session management',
        desc: 'Access tokens expire after 60 minutes. Refresh tokens extend sessions silently. Expiry is handled automatically without disrupting the user.',
    },
];

const Features = () => (
    <section id="features" className="py-24 sm:py-32">
        <div className="mx-auto max-w-[80rem] px-5 sm:px-8">
            <div className="max-w-2xl mb-14">
                <p className="text-sky-400 font-display font-semibold text-sm tracking-wide uppercase mb-3">What's working today</p>
                <h2 className="font-display font-bold text-white text-4xl sm:text-5xl tracking-tight text-balance">
                    Built for settlement finality, not just speed.
                </h2>
                <p className="mt-4 text-white/50 text-lg">
                    Every feature below is implemented, tested, and running on the deployed prototype.
                </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-white/5 rounded-2xl overflow-hidden border border-white/5">
                {features.map((f, i) => (
                    <motion.div key={f.title} variants={fadeUp} initial="hidden" whileInView="show"
                        viewport={{ once: true, margin: '-60px' }} custom={i % 3}
                        className="group bg-[#0b0b1a] p-8 hover:bg-[#0f0f22] transition-colors">
                        <div className="w-11 h-11 grid place-items-center rounded-xl bg-sky-400/10 text-sky-400 group-hover:bg-sky-400 group-hover:text-[#080814] transition-colors">
                            <f.icon className="w-5 h-5" strokeWidth={2} />
                        </div>
                        <h3 className="mt-5 font-display font-semibold text-white text-lg">{f.title}</h3>
                        <p className="mt-2 text-white/55 text-sm leading-relaxed">{f.desc}</p>
                    </motion.div>
                ))}
            </div>
        </div>
    </section>
);

// ── Architecture — replaces the fictional Card section ────────────────────────
const Architecture = () => (
    <section id="architecture" className="py-24 sm:py-32 bg-[#0b0b1a] border-y border-white/5">
        <div className="mx-auto max-w-[80rem] px-5 sm:px-8">
            <div className="max-w-2xl mb-14">
                <p className="text-sky-400 font-display font-semibold text-sm tracking-wide uppercase mb-3">How it's built</p>
                <h2 className="font-display font-bold text-white text-4xl sm:text-5xl tracking-tight text-balance">
                    Two services. One ledger. Zero stored balances.
                </h2>
                <p className="mt-4 text-white/50 text-base">
                    A split-service architecture separates authentication from money movement, sharing one PostgreSQL database.
                </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                {[
                    {
                        label: 'Django API',
                        role: 'Identity',
                        desc: 'Handles registration, login, JWT issuance, and token refresh. Creates one USD account per user on registration.',
                        items: ['POST /api/auth/register/', 'POST /api/auth/login/', 'POST /api/auth/token/refresh/'],
                        color: 'border-sky-400/30 bg-sky-400/5',
                        badge: 'bg-sky-400/15 text-sky-300',
                    },
                    {
                        label: 'FastAPI',
                        role: 'Transactions',
                        desc: 'Owns every financial operation. Validates JWT tokens issued by Django. Drives the blockchain settlement state machine.',
                        items: ['GET /api/balance/:account', 'POST /api/transfer', 'POST /api/accounts/:id/deposit', 'GET /api/settlement/:id'],
                        color: 'border-emerald-400/30 bg-emerald-400/5',
                        badge: 'bg-emerald-400/15 text-emerald-300',
                    },
                    {
                        label: 'PostgreSQL',
                        role: 'Shared ledger',
                        desc: 'Single source of truth. All balances computed from ledger entries — never stored directly. Shared between both services.',
                        items: ['users', 'accounts', 'transactions', 'ledger_entries'],
                        color: 'border-amber-400/30 bg-amber-400/5',
                        badge: 'bg-amber-400/15 text-amber-300',
                    },
                ].map((s) => (
                    <motion.div key={s.label} variants={fadeUp} initial="hidden" whileInView="show"
                        viewport={{ once: true, margin: '-60px' }}
                        className={`rounded-2xl p-7 border flex flex-col gap-4 ${s.color}`}>
                        <div className="flex items-center gap-3">
                            <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${s.badge}`}>{s.role}</span>
                        </div>
                        <h3 className="font-display font-bold text-white text-xl">{s.label}</h3>
                        <p className="text-white/55 text-sm leading-relaxed flex-1">{s.desc}</p>
                        <ul className="space-y-1.5">
                            {s.items.map((item) => (
                                <li key={item} className="flex items-center gap-2 text-xs text-white/40 font-mono">
                                    <span className="w-1 h-1 rounded-full bg-white/20 flex-shrink-0" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </motion.div>
                ))}
            </div>
        </div>
    </section>
);

// ── How it works — replaces the fictional testimonial ─────────────────────────
const HowItWorks = () => (
    <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-[80rem] px-5 sm:px-8">
            <div className="max-w-2xl mb-14">
                <p className="text-sky-400 font-display font-semibold text-sm tracking-wide uppercase mb-3">The settlement flow</p>
                <h2 className="font-display font-bold text-white text-4xl sm:text-5xl tracking-tight text-balance">
                    A transfer either completes fully, or it never starts.
                </h2>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { step: '01', icon: Wallet, title: 'Initiate', desc: 'Source account is debited under a row-level lock. A transaction record is created with status PENDING.' },
                    { step: '02', icon: Layers, title: 'Settle', desc: 'The transfer passes through 8 stages on StormChain — from token conversion to broadcast to confirmation.' },
                    { step: '03', icon: Clock, title: 'Confirm', desc: 'Block confirmations accumulate. Each stage is stored in the database and visible in the dashboard in real time.' },
                    { step: '04', icon: Check, title: 'Deposit', desc: 'On DEPOSITED, the destination account is credited with the final amount minus the gas fee. Status becomes COMPLETED.' },
                ].map((s, i) => (
                    <motion.div key={s.step} variants={fadeUp} initial="hidden" whileInView="show"
                        viewport={{ once: true, margin: '-60px' }} custom={i}
                        className="relative">
                        <div className="text-[10rem] font-display font-black text-white/[0.03] leading-none absolute -top-4 -left-2 select-none pointer-events-none">
                            {s.step}
                        </div>
                        <div className="relative">
                            <div className="w-11 h-11 grid place-items-center rounded-xl bg-sky-400/10 text-sky-400 mb-5">
                                <s.icon className="w-5 h-5" strokeWidth={2} />
                            </div>
                            <h3 className="font-display font-semibold text-white text-lg mb-2">{s.title}</h3>
                            <p className="text-white/50 text-sm leading-relaxed">{s.desc}</p>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    </section>
);

// ── Status — replaces the fictional Pricing section ───────────────────────────
const statusItems = [
    { label: 'User registration & login', done: true },
    { label: 'Deposit & withdrawal', done: true },
    { label: 'Account-to-account transfer', done: true },
    { label: 'Double-entry ledger', done: true },
    { label: 'Blockchain settlement simulation (8 stages)', done: true },
    { label: 'Real-time settlement UI', done: true },
    { label: 'Transaction explorer', done: true },
    { label: 'Concurrent transfer protection', done: true },
    { label: 'Cross-user peer-to-peer transfers', done: false },
    { label: 'Real blockchain network connection', done: false },
    { label: 'Real fiat on/off ramps', done: false },
    { label: 'Multi-currency support', done: false },
];

const Status = () => (
    <section id="status" className="py-24 sm:py-32 bg-[#0b0b1a] border-y border-white/5">
        <div className="mx-auto max-w-[80rem] px-5 sm:px-8">
            <div className="grid lg:grid-cols-2 gap-16 items-start">
                <div>
                    <p className="text-sky-400 font-display font-semibold text-sm tracking-wide uppercase mb-3">Current status</p>
                    <h2 className="font-display font-bold text-white text-4xl sm:text-5xl tracking-tight text-balance mb-6">
                        Prototype — v0.1.0
                    </h2>
                    <p className="text-white/55 text-base leading-relaxed mb-4">
                        StormCash is an architectural prototype and portfolio project. It demonstrates the data model, API design, and user experience of a settlement-finality-first payment system.
                    </p>
                    <p className="text-white/55 text-base leading-relaxed mb-8">
                        No real money is involved. The blockchain settlement layer is a simulation. The ledger, concurrency protections, and authentication are real engineering.
                    </p>
                    <Link to="/register"
                        className="inline-flex items-center gap-2 font-semibold text-[#080814] bg-sky-400 hover:bg-sky-300 transition-colors px-6 py-3.5 rounded-xl">
                        Try the prototype <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>

                <div className="grid grid-cols-1 gap-2">
                    {statusItems.map((item) => (
                        <div key={item.label}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${item.done ? 'border-emerald-400/20 bg-emerald-400/5' : 'border-white/5 bg-white/[0.02]'}`}>
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${item.done ? 'bg-emerald-400/20 text-emerald-400' : 'bg-white/5 text-white/20'}`}>
                                {item.done
                                    ? <Check className="w-3 h-3" strokeWidth={3} />
                                    : <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
                                }
                            </span>
                            <span className={`text-sm ${item.done ? 'text-white/80' : 'text-white/30'}`}>
                                {item.label}
                            </span>
                            {!item.done && (
                                <span className="ml-auto text-[10px] font-semibold uppercase tracking-wider text-white/20">
                                    Roadmap
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </section>
);

// ── Vision CTA — replaces the email-capture CTA section ──────────────────────
const CTA = () => (
    <section className="py-24 sm:py-32 relative overflow-hidden">
        <div className="absolute inset-0">
            <img src={STORM_BG} alt="" className="w-full h-full object-cover opacity-30" aria-hidden="true" />
            <div className="absolute inset-0 bg-gradient-to-b from-[#080814] via-[#080814]/70 to-[#080814]" />
        </div>
        <div className="relative mx-auto max-w-3xl px-5 sm:px-8 text-center">
            <h2 className="font-display font-bold text-white text-4xl sm:text-6xl tracking-tight text-balance">
                The settlement layer the world needs.
            </h2>
            <p className="mt-5 text-white/60 text-lg max-w-xl mx-auto">
                StormChain is the long-term vision — a settlement network where transfers are atomic, fees are transparent, and fiat converts to tokens and back without the user ever seeing the seam.
            </p>
            <p className="mt-3 text-white/35 text-sm max-w-lg mx-auto">
                That's the direction. What exists today is the prototype that proves the architecture works.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/register"
                    className="inline-flex items-center justify-center gap-2 font-semibold text-[#080814] bg-sky-400 hover:bg-sky-300 transition-colors px-8 py-4 rounded-xl text-base">
                    Open an account <ArrowRight className="w-4 h-4" />
                </Link>
                <Link to="/login"
                    className="inline-flex items-center justify-center gap-2 font-medium text-white/80 hover:text-white border border-white/15 hover:border-white/30 px-8 py-4 rounded-xl transition-colors text-base">
                    Sign in
                </Link>
            </div>
            <p className="mt-6 text-white/25 text-xs">
                This is a prototype. No real money is involved.
            </p>
        </div>
    </section>
);

// ── Footer ────────────────────────────────────────────────────────────────────
const Footer = () => (
    <footer className="border-t border-white/5 bg-[#080814] pt-12 pb-10">
        <div className="mx-auto max-w-[80rem] px-5 sm:px-8 flex flex-col md:flex-row justify-between gap-10">
            {/* Brand */}
            <div className="max-w-xs">
                <div className="flex items-center gap-2 text-white font-display font-bold text-lg mb-3">
                    <span className="grid place-items-center w-8 h-8 rounded-lg bg-sky-400 text-[#080814]">
                        <Zap className="w-5 h-5" strokeWidth={2.5} fill="currentColor" />
                    </span>
                    StormCash
                </div>
                <p className="text-white/40 text-sm leading-relaxed">
                    An architectural prototype exploring settlement-finality-first payment infrastructure. Not a bank, not a regulated financial service.
                </p>
            </div>

            {/* Navigation columns */}
            <div className="flex gap-16">
                <div>
                    <h4 className="font-semibold text-white/60 text-xs uppercase tracking-wider mb-4">Prototype</h4>
                    <ul className="space-y-3">
                        <li><Link to="/register" className="text-white/40 hover:text-white text-sm transition-colors">Open account</Link></li>
                        <li><Link to="/login" className="text-white/40 hover:text-white text-sm transition-colors">Sign in</Link></li>
                        <li><Link to="/dashboard" className="text-white/40 hover:text-white text-sm transition-colors">Dashboard</Link></li>
                    </ul>
                </div>
                <div>
                    <h4 className="font-semibold text-white/60 text-xs uppercase tracking-wider mb-4">Learn</h4>
                    <ul className="space-y-3">
                        <li><a href="#features" className="text-white/40 hover:text-white text-sm transition-colors">Features</a></li>
                        <li><a href="#architecture" className="text-white/40 hover:text-white text-sm transition-colors">Architecture</a></li>
                        <li><a href="#status" className="text-white/40 hover:text-white text-sm transition-colors">Status</a></li>
                    </ul>
                </div>
            </div>
        </div>

        <div className="mx-auto max-w-[80rem] px-5 sm:px-8 mt-10 pt-8 border-t border-white/5 flex flex-col sm:flex-row justify-between gap-4 text-white/25 text-xs">
            <p>&copy; {new Date().getFullYear()} StormCash. All rights reserved.</p>
            <p>Prototype — no real money is involved. Not a regulated financial service.</p>
        </div>
    </footer>
);

// ── Page ──────────────────────────────────────────────────────────────────────
const HomePage = () => (
    <div className="bg-[#080814] min-h-screen selection:bg-sky-400 selection:text-[#080814]">
        <Header />
        <main>
            <Hero />
            <Ticker />
            <Features />
            <Architecture />
            <HowItWorks />
            <Status />
            <CTA />
        </main>
        <Footer />
    </div>
);

export default HomePage;
