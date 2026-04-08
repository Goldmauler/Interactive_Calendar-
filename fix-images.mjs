import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';

const targets = [
  { file: 'month-04.png', url: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=1000&q=80' },
  { file: 'month-09.png', url: 'https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?w=1000&q=80' },
  { file: 'month-10.png', url: 'https://images.unsplash.com/photo-1441974231531-c6227dbb6b6e?w=1000&q=80' },
  { file: 'month-12.png', url: 'https://images.unsplash.com/photo-1426604908152-8d1142f7eb22?w=1000&q=80' },
];

async function fixImages() {
  const dir = path.join(process.cwd(), 'public', 'images');
  for (const {file, url} of targets) {
    try {
      const res = await fetch(url);
      const buffer = await res.arrayBuffer();
      if (buffer.byteLength > 1000) { // Verify it's a real image, not 29 byte 404
        fs.writeFileSync(path.join(dir, file), Buffer.from(buffer));
        console.log(`Successfully fixed ${file}`);
      } else {
        console.error(`Failed to fetch proper image for ${file}, trying fallback...`);
        // Fallback to copying month-01 if it fails
        fs.copyFileSync(path.join(dir, 'month-01.png'), path.join(dir, file));
      }
    } catch (e) {
       console.error(`Fetch exception for ${file}`, e);
       fs.copyFileSync(path.join(dir, 'month-01.png'), path.join(dir, file));
    }
  }
}

fixImages();
