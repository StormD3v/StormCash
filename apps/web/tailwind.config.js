/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ['class'],
    content: [
        './src/**/*.{js,jsx}',
    ],
    theme: {
        container: {
            center: true,
            padding: '2rem',
            screens: {
                '2xl': '1400px',
            },
        },
        extend: {
            colors: {
                ground: '#12151c',
                panel: '#191d26',
                gold: {
                    DEFAULT: '#d9a35c',
                    dim: '#8a6a3f',
                },
                storm: {
                    DEFAULT: '#7688a8',
                    dim: '#4a5568',
                },
                text: {
                    hi: '#ece9e0',
                    mid: '#96958f',
                    low: '#58564f',
                },
                // Semantic action colors — restrained palette
                credit: '#7dc9a0',   // soft green for deposits / credits
                debit: '#c08090',   // muted rose for withdrawals / debits
                // Radix / shadcn compat
                border: '#4a5568',
                input: '#4a5568',
                ring: '#d9a35c',
                background: '#12151c',
                foreground: '#ece9e0',
                primary: {
                    DEFAULT: '#d9a35c',
                    foreground: '#12151c',
                },
                secondary: {
                    DEFAULT: '#7688a8',
                    foreground: '#ece9e0',
                },
                destructive: {
                    DEFAULT: 'hsl(var(--destructive))',
                    foreground: 'hsl(var(--destructive-foreground))',
                },
                muted: {
                    DEFAULT: '#191d26',
                    foreground: '#96958f',
                },
                accent: {
                    DEFAULT: '#4a5568',
                    foreground: '#ece9e0',
                },
                popover: {
                    DEFAULT: '#191d26',
                    foreground: '#ece9e0',
                },
                card: {
                    DEFAULT: '#191d26',
                    foreground: '#ece9e0',
                },
            },
            fontFamily: {
                display: ['"Fraunces"', 'serif'],
                sans: ['"Inter"', 'sans-serif'],
                mono: ['"JetBrains Mono"', 'monospace'],
            },
            fontSize: {
                // Balance — the hero number
                'balance': ['3.25rem', { lineHeight: '1', letterSpacing: '-0.03em', fontWeight: '900' }],
                'balance-lg': ['3.75rem', { lineHeight: '1', letterSpacing: '-0.03em', fontWeight: '900' }],
            },
            spacing: {
                // Consistent section rhythm
                'section': '2rem',   // 32px between major sections
                'group': '1.5rem', // 24px between related groups
                'item': '1rem',   // 16px between list items / form fields
                'tight': '0.5rem', // 8px between label and control
            },
            borderRadius: {
                lg: 'var(--radius)',
                md: 'calc(var(--radius) - 2px)',
                sm: 'calc(var(--radius) - 4px)',
            },
            boxShadow: {
                'card': '0 1px 2px rgba(0,0,0,0.35), 0 4px 12px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.03)',
                'card-raised': '0 1px 3px rgba(0,0,0,0.4), 0 8px 24px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.04)',
                'gold': '0 0 0 1px rgba(217,163,92,0.2), 0 4px 16px rgba(217,163,92,0.12)',
                'glow-blue': '0 0 0 1px rgba(59,130,246,0.25), 0 4px 24px rgba(59,130,246,0.18), 0 12px 48px rgba(59,130,246,0.12)',
                'inset-top': 'inset 0 1px 0 0 rgba(255,255,255,0.04)',
            },
            keyframes: {
                'accordion-down': {
                    from: { height: '0' },
                    to: { height: 'var(--radix-accordion-content-height)' },
                },
                'accordion-up': {
                    from: { height: 'var(--radix-accordion-content-height)' },
                    to: { height: '0' },
                },
                'pulse-gold': {
                    '0%, 100%': { opacity: '1' },
                    '50%': { opacity: '0.5' },
                },
                'spin-slow': {
                    from: { transform: 'rotate(0deg)' },
                    to: { transform: 'rotate(360deg)' },
                },
            },
            animation: {
                'accordion-down': 'accordion-down 0.2s ease-out',
                'accordion-up': 'accordion-up 0.2s ease-out',
                'pulse-gold': 'pulse-gold 2s ease-in-out infinite',
                'spin-slow': 'spin-slow 1.2s linear infinite',
            },
            transitionTimingFunction: {
                'out-expo': 'cubic-bezier(0.22, 1, 0.36, 1)',
            },
        },
    },
    plugins: [require('tailwindcss-animate')],
};
