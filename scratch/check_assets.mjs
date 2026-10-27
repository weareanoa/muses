import fs from 'fs';
import path from 'path';

async function main() {
  const res = await fetch('http://localhost:4321');
  const html = await res.text();
  const re = /src=["']([^"']+\.(?:svg|png|jpg|webp))["']/gi;
  const matches = [...html.matchAll(re)].map(m => m[1]);
  const unique = [...new Set(matches)];

  console.log('Total unique images in initial HTML:', unique.length);
  let totalBytes = 0;
  for (const src of unique) {
    const cleanSrc = src.replace(/^\//, '').split('?')[0];
    const filePath = path.join(process.cwd(), 'public', cleanSrc);
    if (fs.existsSync(filePath)) {
      const stat = fs.statSync(filePath);
      totalBytes += stat.size;
      console.log(`${(stat.size / 1024 / 1024).toFixed(2)} MB: ${src}`);
    } else {
      console.log(`Not found in public: ${src}`);
    }
  }
  console.log(`\nTOTAL DOWNLOAD SIZE FOR IMAGES: ${(totalBytes / 1024 / 1024).toFixed(2)} MB`);
}

main().catch(console.error);
