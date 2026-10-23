import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const imagesDir = join(root, 'public', 'images');
const audioDir = join(root, 'public', 'audio');
mkdirSync(join(imagesDir, 'members'), { recursive: true });
mkdirSync(join(imagesDir, 'albums'), { recursive: true });
mkdirSync(join(imagesDir, 'store'), { recursive: true });
mkdirSync(join(imagesDir, 'tours'), { recursive: true });
mkdirSync(audioDir, { recursive: true });

const frame = (w, h) => `
  <rect x="0" y="0" width="${w}" height="${h}" fill="#fcfaf5"/>
  <rect x="28" y="28" width="${w - 56}" height="${h - 56}" fill="none" stroke="#c9a227" stroke-opacity="0.45" stroke-width="2"/>
`;

const label = (text, sub = 'PLACEHOLDER') => `
  <text x="50%" y="88%" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="26" font-weight="700" letter-spacing="8" fill="#7d5c16">${text}</text>
  <text x="50%" y="93%" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="13" letter-spacing="6" fill="#9a7420" opacity="0.7">${sub}</text>
`;

const goldDefs = (id = 'g') => `
  <defs>
    <linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#e9d8a6"/>
      <stop offset="45%" stop-color="#c9a227"/>
      <stop offset="100%" stop-color="#8a6a1c"/>
    </linearGradient>
  </defs>
`;

function portrait(labelText, variant) {
  const cx = 400 + (variant % 3 - 1) * 24;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000" width="800" height="1000">${frame(800, 1000)}${goldDefs()}
  <circle cx="${cx}" cy="420" r="185" fill="url(#g)" opacity="0.92"/>
  <circle cx="${cx}" cy="420" r="150" fill="#fcfaf5" opacity="0.18"/>
  <path d="M150 1000 C150 720 300 620 400 620 C500 620 650 720 650 1000 Z" fill="url(#g)" opacity="0.75"/>
  <path d="M${cx - 120} 400 Q${cx} 250 ${cx + 120} 400" fill="none" stroke="#fcfaf5" stroke-width="10" opacity="0.45"/>
  ${label(labelText, 'MEMBER PORTRAIT')}
  </svg>`;
}

function album(labelText) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="800" height="800">${frame(800, 800)}${goldDefs()}
  <rect x="110" y="110" width="580" height="580" fill="url(#g)" opacity="0.14"/>
  <circle cx="400" cy="370" r="190" fill="none" stroke="#9a7420" stroke-width="2" opacity="0.6"/>
  <circle cx="400" cy="370" r="130" fill="none" stroke="#9a7420" stroke-width="1.5" opacity="0.5"/>
  <circle cx="400" cy="370" r="72" fill="url(#g)" opacity="0.85"/>
  <circle cx="400" cy="370" r="18" fill="#fcfaf5"/>
  <path d="M400 90 L418 130 L400 170 L382 130 Z" fill="#9a7420" opacity="0.7"/>
  ${label(labelText, 'ALBUM COVER')}
  </svg>`;
}

function product(labelText) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="800" height="800">${frame(800, 800)}${goldDefs()}
  <path d="M240 260 L400 180 L560 260 L560 540 L400 620 L240 540 Z" fill="url(#g)" opacity="0.18" stroke="#9a7420" stroke-width="2"/>
  <path d="M240 260 L400 340 L560 260 M400 340 L400 620" fill="none" stroke="#9a7420" stroke-width="3" opacity="0.65"/>
  <circle cx="400" cy="340" r="34" fill="#c9a227" opacity="0.5"/>
  ${label(labelText, 'OFFICIAL MERCH')}
  </svg>`;
}

function poster(labelText) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000" width="800" height="1000">${frame(800, 1000)}${goldDefs()}
  <circle cx="400" cy="430" r="230" fill="none" stroke="url(#g)" stroke-width="3" opacity="0.8"/>
  <circle cx="400" cy="430" r="170" fill="none" stroke="#9a7420" stroke-width="1.5" opacity="0.45"/>
  <circle cx="400" cy="430" r="80" fill="url(#g)" opacity="0.55"/>
  <path d="M120 700 Q400 560 680 700" fill="none" stroke="#9a7420" stroke-width="2" opacity="0.45"/>
  ${label(labelText, 'TOUR POSTER')}
  </svg>`;
}

function group() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800" width="1200" height="800">${frame(1200, 800)}${goldDefs()}
  <g opacity="0.85">
    <ellipse cx="600" cy="420" rx="420" ry="240" fill="url(#g)" opacity="0.12"/>
    ${[0, 1, 2, 3, 4].map((i) => {
      const x = 390 + i * 105;
      const h = 300 + (i % 2) * 40;
      return `<g>
        <circle cx="${x}" cy="${400 - h / 2 + 30}" r="42" fill="url(#g)" opacity="0.8"/>
        <rect x="${x - 48}" y="${400 - h / 2 + 80}" width="96" height="${h - 60}" rx="48" fill="url(#g)" opacity="0.55"/>
      </g>`;
    }).join('')}
  </g>
  </svg>`;
}

function vinyl() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="800" height="800">
  <defs>
    <radialGradient id="disc" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#3a3122"/>
      <stop offset="55%" stop-color="#241f16"/>
      <stop offset="100%" stop-color="#14110c"/>
    </radialGradient>
  </defs>
  <circle cx="400" cy="400" r="390" fill="url(#disc)"/>
  ${Array.from({ length: 22 }).map((_, i) => `<circle cx="400" cy="400" r="${120 + i * 12}" fill="none" stroke="#c9a227" stroke-opacity="${0.06 + i * 0.004}" stroke-width="1"/>`).join('')}
  <circle cx="400" cy="400" r="120" fill="#c9a227"/>
  <circle cx="400" cy="400" r="96" fill="#fcfaf5" opacity="0.9"/>
  <circle cx="400" cy="400" r="8" fill="#241f16"/>
  <path d="M400 304 L420 348 L400 392 L380 348 Z" fill="#9a7420" opacity="0.8"/>
  </svg>`;
}

const members = ['MEMBER 01', 'MEMBER 02', 'MEMBER 03', 'MEMBER 04', 'MEMBER 05'];
members.forEach((m, i) => writeFileSync(join(imagesDir, 'members', `member-${i + 1}.svg`), portrait(m, i)));

const albums = Array.from({ length: 10 }, (_, i) => `ALBUM ${String(i + 1).padStart(2, '0')}`);
albums.forEach((a, i) => writeFileSync(join(imagesDir, 'albums', `album-${i + 1}.svg`), album(a)));

const products = Array.from({ length: 6 }, (_, i) => `PRODUCT ${String(i + 1).padStart(2, '0')}`);
products.forEach((p, i) => writeFileSync(join(imagesDir, 'store', `product-${i + 1}.svg`), product(p)));

const posters = Array.from({ length: 5 }, (_, i) => `CITY ${String(i + 1).padStart(2, '0')}`);
posters.forEach((p, i) => writeFileSync(join(imagesDir, 'tours', `poster-${i + 1}.svg`), poster(p)));

writeFileSync(join(imagesDir, 'group-photo.svg'), group());
writeFileSync(join(imagesDir, 'vinyl-master.svg'), vinyl());

writeFileSync(
  join(root, 'public', 'favicon.svg'),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <rect width="64" height="64" rx="14" fill="#fcfaf5"/>
  <rect x="4" y="4" width="56" height="56" rx="11" fill="none" stroke="#c9a227" stroke-width="2"/>
  <path d="M18 46 V18 L32 34 L46 18 V46" fill="none" stroke="#9a7420" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`
);

function createPreviewWav(path) {
  const sampleRate = 22050;
  const seconds = 12;
  const total = sampleRate * seconds;
  const dataSize = total * 2;
  const buffer = Buffer.alloc(44 + dataSize);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  const notes = [220, 277.18, 329.63];
  for (let i = 0; i < total; i++) {
    const t = i / sampleRate;
    const fade = Math.min(1, t / 1.2) * Math.min(1, (seconds - t) / 1.2);
    let sample = 0;
    notes.forEach((freq, idx) => {
      sample += Math.sin(2 * Math.PI * freq * t + idx) * 0.055;
      sample += Math.sin(2 * Math.PI * freq * 2 * t) * 0.012;
    });
    const wobble = 0.85 + 0.15 * Math.sin(2 * Math.PI * 0.15 * t);
    buffer.writeInt16LE(Math.round(sample * fade * wobble * 32767), 44 + i * 2);
  }
  writeFileSync(path, buffer);
}

createPreviewWav(join(audioDir, 'preview.wav'));

console.log('Generated placeholder assets and preview audio.');

