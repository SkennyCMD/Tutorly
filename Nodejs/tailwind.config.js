/**
 * Tailwind CSS configuration - replaces the runtime `tailwind.config = {...}`
 * object every page used to set after loading the Play CDN script
 * (see views/partials/theme-config.ejs, now removed). Ported 1:1 from that
 * file so switching to a locally-built stylesheet doesn't change how any
 * page looks.
 *
 * `content` lists every file Tailwind scans for class names actually used,
 * so the generated stylesheet only includes what's needed. It's a plain
 * text scan (not an AST), so a utility class is picked up as long as it
 * appears verbatim somewhere in one of these files - including inside a
 * ternary or object/array lookup in a .js file, not just inside a literal
 * class="..." attribute. Nothing in this codebase builds a class name via
 * string interpolation (e.g. `bg-${color}`), which the scanner could not
 * detect - verified across every view and public/js file before relying on
 * this content-scanning approach.
 */
module.exports = {
    content: ['./views/**/*.ejs', './public/js/**/*.js'],
    theme: {
        extend: {
            colors: {
                background: 'rgb(var(--color-background) / <alpha-value>)',
                foreground: 'rgb(var(--color-foreground) / <alpha-value>)',
                card: 'rgb(var(--color-card) / <alpha-value>)',
                'card-foreground': 'rgb(var(--color-card-foreground) / <alpha-value>)',
                primary: 'rgb(var(--color-primary) / <alpha-value>)',
                'primary-hover': 'rgb(var(--color-primary-hover) / <alpha-value>)',
                'primary-foreground': 'rgb(var(--color-primary-foreground) / <alpha-value>)',
                secondary: 'rgb(var(--color-secondary) / <alpha-value>)',
                'secondary-foreground': 'rgb(var(--color-secondary-foreground) / <alpha-value>)',
                muted: 'rgb(var(--color-muted) / <alpha-value>)',
                'muted-foreground': 'rgb(var(--color-muted-foreground) / <alpha-value>)',
                border: 'rgb(var(--color-border) / <alpha-value>)',
                ring: 'rgb(var(--color-ring) / <alpha-value>)',
                destructive: 'rgb(var(--color-destructive) / <alpha-value>)',
                lesson: 'rgb(var(--color-lesson) / <alpha-value>)',
                note: 'rgb(var(--color-note) / <alpha-value>)',
            },
            // Only login.ejs/cookies.ejs/privacy.ejs use this (as `font-inter`
            // on <body>, alongside the Google Fonts <link> that actually loads
            // Inter) - kept as its own key, not the default `sans`, so every
            // other page's base font stays exactly what it was with the CDN:
            // Tailwind's own default sans stack, untouched.
            fontFamily: {
                inter: ['Inter', 'sans-serif'],
            },
        },
    },
    plugins: [],
};
