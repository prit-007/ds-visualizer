// GitHub Pages serves 404.html for unknown paths — copy index.html there
// so client-side routes (/tree, /sorting, ...) resolve on deep links.
import { copyFileSync } from 'node:fs';

copyFileSync('dist/index.html', 'dist/404.html');
console.log('spa-fallback: dist/index.html → dist/404.html');
