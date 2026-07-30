import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Zap, ShieldCheck, ArrowRight, Menu, X, TrendingUp,
    Wallet, Globe, Lock, BarChart3, Sparkles, Check
} from 'lucide-react';

const APP_SHOT = 'https://images.hostinger.com/a7d73a97-49b4-4cb8-bad2-e8c552829bea.png';
const STORM_BG = 'https://images.hostinger.com/b477bcbc-972b-446e-b16c-4c5c348a0fc5.png';
const LIFESTYLE = 'https://images.hostinger.com/47239d53-1293-4965-ba5a-3e3fcaa956bc.png';
const CARD_IMG = 'https://images.hostinger.com/269ff6c2-91fc-49a6-a378-a8beddac9bef.png';

const fadeUp = {
    hidden: { opacity: 0, y: 28 },
    show: (i = 0) => ({
        opacity: 1, y: 0,
        transition: { duration: 0.6, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }
    })
};

const nav = ['Product', 'Business', 'Pricing', 'Company'];

const Header = () => {
    const [open, setOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, []);
    return (
        <header className={`fixed top-0 inset-x-0 z-50 transition-colors duration-300 ${scrolled ? 'bg-[#080814]/85 backdrop-blur-xl border-b border-white/5' : 'bg-transparent'}`}>
            <div className="mx-auto max-w-[80rem] px-5 sm:px-8 h-16 flex items-center justify-between">
                <a href="#top" className="flex items-center gap-2 text-white font-display font-bold text-lg tracking-tight">
                    <span className="grid place-items-center w-8 h-8 rounded-lg bg-sky-400 text-[#080814]">
                        <Zap className="w-5 h-5" strokeWidth={2.5} fill="currentColor" />
                    </span>
                    StormCash
                </a>
                <nav className="hidden md:flex items-center gap-8 text-sm text-white/70">
                    {nav.map((n) => (
                        <a key={n} href="#" className="hover:text-white transition-colors">{n}</a>
                    ))}
                </nav>
                <div className="hidden md:flex items-center gap-3">
                    <a href="#" className="text-sm text-white/70 hover:text-white transition-colors">Sign in</a>
                    <a href="#cta" className="text-sm font-semibold text-[#080814] bg-sky-400 hover:bg-sky-300 transition-colors px-4 py-2 rounded-lg">Get the app</a>
                </div>
                <button className="md:hidden text-white" onClick={() => setOpen(!open)} aria-label="Menu">
                    {open ? <X /> : <Menu />}
                </button>
            </div>
            {open && (
                <div className="md:hidden bg-[#080814] border-t border-white/5 px-5 py-4 flex flex-col gap-4 text-white/80">
                    {nav.map((n) => <a key={n} href="#" onClick={() => setOpen(false)}>{n}</a>)}
                    <a href="#cta" onClick={() => setOpen(false)} className="text-center font-semibold text-[#080814] bg-sky-400 px-4 py-2.5 rounded-lg">Get the app</a>
                </div>
            )}
        </header>
    );
};

const Hero = () => (
    <section id="top" className="relative min-h-[100dvh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
            <img src={STORM_BG} alt="" className="w-full h-full object-cover opacity-50" />
            <div className="absolute inset-0 bg-gradient-to-b from-[#080814]/70 via-[#080814]/60 to-[#080814]" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#080814] via-transparent to-transparent" />
        </div>
        <div className="relative mx-auto max-w-[80rem] px-5 sm:px-8 w-full grid lg:grid-cols-2 gap-12 items-center pt-28 pb-16">
            <div>
                <motion.div variants={fadeUp} initial="hidden" animate="show" custom={0}
                    className="inline-flex items-center gap-2 rounded-full border border-sky-400/30 bg-sky-400/10 px-3 py-1 text-xs font-medium text-sky-300 mb-6">
                    <Sparkles className="w-3.5 h-3.5" /> Now live in 32 countries
                </motion.div>
                <motion.h1 variants={fadeUp} initial="hidden" animate="show" custom={1}
                    className="font-display font-bold text-white text-5xl sm:text-6xl lg:text-7xl leading-[0.95] tracking-tight text-balance">
                    Money that moves at the speed of <span className="text-sky-400 animate-flicker">lightning</span>.
                </motion.h1>
                <motion.p variants={fadeUp} initial="hidden" animate="show" custom={2}
                    className="mt-6 text-lg text-white/60 max-w-md">
                    Instant transfers, zero-fee spending abroad, and smart accounts that grow your balance. StormCash is banking rebuilt for how you actually live.
                </motion.p>
                <motion.div variants={fadeUp} initial="hidden" animate="show" custom={3}
                    className="mt-8 flex flex-wrap items-center gap-4">
                    <a href="#cta" className="group inline-flex items-center gap-2 font-semibold text-[#080814] bg-sky-400 hover:bg-sky-300 transition-colors px-6 py-3.5 rounded-xl">
                        Open your account <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </a>
                    <a href="#features" className="inline-flex items-center gap-2 font-medium text-white/80 hover:text-white border border-white/15 hover:border-white/30 px-6 py-3.5 rounded-xl transition-colors">
                        See how it works
                    </a>
                </motion.div>
                <motion.div variants={fadeUp} initial="hidden" animate="show" custom={4}
                    className="mt-10 flex items-center gap-6 text-sm text-white/50">
                    <span className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-sky-400" /> Bank-grade security</span>
                    <span className="flex items-center gap-2"><Check className="w-4 h-4 text-sky-400" /> No hidden fees</span>
                </motion.div>
            </div>
            <motion.div initial={{ opacity: 0, y: 40, rotate: 2 }} animate={{ opacity: 1, y: 0, rotate: 0 }}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
                className="relative hidden lg:block">
                <div className="absolute -inset-8 bg-sky-500/20 blur-3xl rounded-full" />
                <img src={APP_SHOT} alt="StormCash mobile banking app dashboard"
                    className="relative mx-auto w-[320px] rounded-[2.5rem] shadow-2xl shadow-sky-900/40 border border-white/10" />
            </motion.div>
        </div>
    </section>
);

const tickerItems = ['Instant transfers', 'Zero FX fees', 'Smart savings', 'Real-time alerts', 'Crypto trading', 'Virtual cards', 'Round-up investing', 'Global payments'];
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

const features = [
    { icon: Zap, title: 'Instant transfers', desc: 'Send and receive money in under a second, day or night, to anyone on StormCash.' },
    { icon: Globe, title: 'Spend anywhere', desc: 'Real exchange rates in 150+ currencies with no markup and no surprise charges.' },
    { icon: TrendingUp, title: 'Grow your balance', desc: 'Auto round-ups and smart pots earn interest while you get on with your day.' },
    { icon: Lock, title: 'Locked down tight', desc: 'Biometric login, instant card freeze, and 24/7 fraud monitoring built in.' },
    { icon: BarChart3, title: 'See every penny', desc: 'Live analytics categorise your spending so you always know where money goes.' },
    { icon: Wallet, title: 'One smart wallet', desc: 'Cards, crypto, savings, and subscriptions — managed from a single home screen.' },
];

const Features = () => (
    <section id="features" className="py-24 sm:py-32">
        <div className="mx-auto max-w-[80rem] px-5 sm:px-8">
            <div className="max-w-2xl">
                <p className="text-sky-400 font-display font-semibold text-sm tracking-wide uppercase mb-3">Everything in one place</p>
                <h2 className="font-display font-bold text-white text-4xl sm:text-5xl tracking-tight text-balance">
                    A full financial toolkit, minus the friction.
                </h2>
            </div>
            <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-white/5 rounded-2xl overflow-hidden border border-white/5">
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

const stats = [
    { v: '4.2M+', l: 'active accounts' },
    { v: '£38B', l: 'moved last year' },
    { v: '0.3s', l: 'average transfer' },
    { v: '4.9', l: 'app store rating' },
];
const Stats = () => (
    <section className="py-16 border-y border-white/5 bg-[#0b0b1a]">
        <div className="mx-auto max-w-[80rem] px-5 sm:px-8 grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((s, i) => (
                <motion.div key={s.l} variants={fadeUp} initial="hidden" whileInView="show"
                    viewport={{ once: true }} custom={i} className="text-center lg:text-left">
                    <div className="font-display font-bold text-white text-4xl sm:text-5xl tracking-tight">{s.v}</div>
                    <div className="mt-1 text-white/45 text-sm">{s.l}</div>
                </motion.div>
            ))}
        </div>
    </section>
);

const Card = () => (
    <section className="py-24 sm:py-32 overflow-hidden">
        <div className="mx-auto max-w-[80rem] px-5 sm:px-8 grid lg:grid-cols-2 gap-16 items-center">
            <motion.div initial={{ opacity: 0, scale: 0.92 }} whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="relative order-2 lg:order-1">
                <div className="absolute -inset-6 bg-sky-500/15 blur-3xl rounded-full" />
                <img src={CARD_IMG} alt="StormCash matte black metal payment card"
                    className="relative rounded-2xl border border-white/10 shadow-2xl w-full" />
            </motion.div>
            <div className="order-1 lg:order-2">
                <p className="text-sky-400 font-display font-semibold text-sm tracking-wide uppercase mb-3">The Storm Card</p>
                <h2 className="font-display font-bold text-white text-4xl sm:text-5xl tracking-tight text-balance">
                    Metal card. Cashback that hits back.
                </h2>
                <p className="mt-5 text-white/60 text-lg max-w-md">
                    Precision-milled from aerospace-grade steel, the Storm Card earns up to 3% cashback on everyday spend and unlocks airport lounges worldwide.
                </p>
                <ul className="mt-8 space-y-4">
                    {['Up to 3% cashback on all purchases', 'Free withdrawals worldwide', 'Instant freeze and virtual cards'].map((t) => (
                        <li key={t} className="flex items-center gap-3 text-white/80">
                            <span className="grid place-items-center w-6 h-6 rounded-full bg-sky-400/15 text-sky-400 flex-shrink-0">
                                <Check className="w-3.5 h-3.5" strokeWidth={3} />
                            </span>
                            {t}
                        </li>
                    ))}
                </ul>
                <a href="#cta" className="mt-9 group inline-flex items-center gap-2 font-semibold text-[#080814] bg-sky-400 hover:bg-sky-300 transition-colors px-6 py-3.5 rounded-xl">
                    Order your card <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </a>
            </div>
        </div>
    </section>
);

const Quote = () => (
    <section className="py-24 sm:py-32 bg-[#0b0b1a] border-y border-white/5">
        <div className="mx-auto max-w-[80rem] px-5 sm:px-8 grid lg:grid-cols-2 gap-14 items-center">
            <div className="relative">
                <img src={LIFESTYLE} alt="A StormCash customer paying with the app"
                    className="rounded-2xl border border-white/10 w-full object-cover aspect-[4/3]" />
            </div>
            <div>
                <div className="text-sky-400 font-display text-6xl leading-none mb-4">&ldquo;</div>
                <blockquote className="font-display font-medium text-white text-2xl sm:text-3xl leading-snug tracking-tight text-balance">
                    I run three businesses from my phone. StormCash pays my suppliers abroad before I&rsquo;ve finished my coffee.
                </blockquote>
                <div className="mt-6">
                    <div className="font-semibold text-white">Amara Okafor</div>
                    <div className="text-white/45 text-sm">Founder, Vertex Studio &middot; London</div>
                </div>
            </div>
        </div>
    </section>
);

const plans = [
    { name: 'Standard', price: 'Free', tag: 'Everything to get started', feats: ['Free UK & EU transfers', 'Fee-free spend abroad up to £1k/mo', 'Instant spending alerts', 'One virtual card'], cta: 'Get started', hl: false },
    { name: 'Storm', price: '£6.99', per: '/mo', tag: 'For everyday power users', feats: ['Everything in Standard', 'Unlimited fee-free FX', 'Up to 2% cashback', '5 savings pots at 4.1% AER', 'Airport lounge passes'], cta: 'Go Storm', hl: true },
    { name: 'Metal', price: '£14.99', per: '/mo', tag: 'The full StormCash arsenal', feats: ['Everything in Storm', 'Aerospace metal card', '3% cashback on all spend', 'Dedicated concierge', 'Worldwide travel insurance'], cta: 'Go Metal', hl: false },
];
const Pricing = () => (
    <section id="pricing" className="py-24 sm:py-32">
        <div className="mx-auto max-w-[80rem] px-5 sm:px-8">
            <div className="max-w-2xl mb-14">
                <p className="text-sky-400 font-display font-semibold text-sm tracking-wide uppercase mb-3">Plans</p>
                <h2 className="font-display font-bold text-white text-4xl sm:text-5xl tracking-tight text-balance">Pick your power level.</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
                {plans.map((p, i) => (
                    <motion.div key={p.name} variants={fadeUp} initial="hidden" whileInView="show"
                        viewport={{ once: true, margin: '-60px' }} custom={i}
                        className={`rounded-2xl p-8 border flex flex-col ${p.hl ? 'bg-gradient-to-b from-sky-500/15 to-[#0b0b1a] border-sky-400/40' : 'bg-[#0b0b1a] border-white/8'}`}>
                        {p.hl && <span className="self-start mb-4 text-xs font-semibold text-[#080814] bg-sky-400 px-3 py-1 rounded-full">Most popular</span>}
                        <h3 className="font-display font-bold text-white text-xl">{p.name}</h3>
                        <p className="text-white/45 text-sm mt-1">{p.tag}</p>
                        <div className="mt-5 flex items-end gap-1">
                            <span className="font-display font-bold text-white text-4xl">{p.price}</span>
                            {p.per && <span className="text-white/45 mb-1">{p.per}</span>}
                        </div>
                        <ul className="mt-7 space-y-3 flex-1">
                            {p.feats.map((f) => (
                                <li key={f} className="flex items-start gap-2.5 text-sm text-white/70">
                                    <Check className="w-4 h-4 text-sky-400 mt-0.5 flex-shrink-0" strokeWidth={2.5} /> {f}
                                </li>
                            ))}
                        </ul>
                        <a href="#cta" className={`mt-8 text-center font-semibold px-5 py-3 rounded-xl transition-colors ${p.hl ? 'bg-sky-400 text-[#080814] hover:bg-sky-300' : 'border border-white/15 text-white hover:border-white/30'}`}>{p.cta}</a>
                    </motion.div>
                ))}
            </div>
        </div>
    </section>
);

const CTA = () => (
    <section id="cta" className="py-24 sm:py-32 relative overflow-hidden">
        <div className="absolute inset-0">
            <img src={STORM_BG} alt="" className="w-full h-full object-cover opacity-30" />
            <div className="absolute inset-0 bg-gradient-to-b from-[#080814] via-[#080814]/70 to-[#080814]" />
        </div>
        <div className="relative mx-auto max-w-3xl px-5 sm:px-8 text-center">
            <h2 className="font-display font-bold text-white text-4xl sm:text-6xl tracking-tight text-balance">
                Ready to weather any storm?
            </h2>
            <p className="mt-5 text-white/60 text-lg max-w-xl mx-auto">
                Open a full StormCash account in under three minutes. No paperwork, no queues, no fees to start.
            </p>
            <form onSubmit={(e) => e.preventDefault()} className="mt-9 flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <input type="email" required placeholder="Enter your email"
                    className="flex-1 rounded-xl bg-white/5 border border-white/15 px-4 py-3.5 text-white placeholder:text-white/40 focus:outline-none focus:border-sky-400 transition-colors" />
                <button type="submit" className="font-semibold text-[#080814] bg-sky-400 hover:bg-sky-300 transition-colors px-6 py-3.5 rounded-xl whitespace-nowrap">
                    Get early access
                </button>
            </form>
            <p className="mt-4 text-white/35 text-xs">By signing up you agree to our Terms and Privacy Policy.</p>
        </div>
    </section>
);

const Footer = () => {
    const cols = {
        Product: ['Personal', 'Business', 'Storm Card', 'Savings', 'Crypto'],
        Company: ['About', 'Careers', 'Press', 'Blog'],
        Legal: ['Privacy', 'Terms', 'Security', 'Cookies'],
    };
    return (
        <footer className="border-t border-white/5 bg-[#080814] pt-16 pb-10">
            <div className="mx-auto max-w-[80rem] px-5 sm:px-8 grid gap-12 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
                <div>
                    <div className="flex items-center gap-2 text-white font-display font-bold text-lg">
                        <span className="grid place-items-center w-8 h-8 rounded-lg bg-sky-400 text-[#080814]">
                            <Zap className="w-5 h-5" strokeWidth={2.5} fill="currentColor" />
                        </span>
                        StormCash
                    </div>
                    <p className="mt-4 text-white/45 text-sm max-w-xs">Banking rebuilt for the way you move. Fast, borderless, and built to keep your money safe.</p>
                </div>
                {Object.entries(cols).map(([title, links]) => (
                    <div key={title}>
                        <h4 className="font-display font-semibold text-white text-sm mb-4">{title}</h4>
                        <ul className="space-y-3">
                            {links.map((l) => (
                                <li key={l}><a href="#" className="text-white/45 hover:text-white text-sm transition-colors">{l}</a></li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
            <div className="mx-auto max-w-[80rem] px-5 sm:px-8 mt-12 pt-8 border-t border-white/5 flex flex-col sm:flex-row justify-between gap-4 text-white/35 text-xs">
                <p>&copy; {new Date().getFullYear()} StormCash Financial Ltd. All rights reserved.</p>
                <p>StormCash is an e-money institution, not a bank. Funds are safeguarded.</p>
            </div>
        </footer>
    );
};

const HomePage = () => (
    <div className="bg-[#080814] min-h-screen selection:bg-sky-400 selection:text-[#080814]">
        <Header />
        <main>
            <Hero />
            <Ticker />
            <Features />
            <Stats />
            <Card />
            <Quote />
            <Pricing />
            <CTA />
        </main>
        <Footer />
    </div>
);

export default HomePage;
