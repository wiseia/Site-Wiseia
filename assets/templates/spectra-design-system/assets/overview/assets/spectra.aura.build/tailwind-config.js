/* the page's Play-CDN config (inline in the source <head>): forest palette + font stacks */
tailwind.config = {
theme: {
extend: {
colors: {
forest: {
50: '#f2f8f6',
100: '#e1efe8',
200: '#c3ddcf',
300: '#96c3ad',
400: '#62a386',
500: '#3f8568',
600: '#2f6a52',
700: '#265543',
800: '#224437',
900: '#1d392f',
950: '#0a1814', // Deep Black Green
}
},
fontFamily: {
sans: ['ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
serif: ['Times New Roman', 'serif'],
bricolage: ['Bricolage Grotesque', 'sans-serif'],
}
}
}
}
