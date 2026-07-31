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
            borderRadius: {
                lg: 'var(--radius)',
                md: 'calc(var(--radius) - 2px)',
                sm: 'calc(var(--radius) - 4px)',
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
            },
            animation: {
                'accordion-down': 'accordion-down 0.2s ease-out',
                'accordion-up': 'accordion-up 0.2s ease-out',
            },
        },
    },
    plugins: [require('tailwindcss-animate')],
};
