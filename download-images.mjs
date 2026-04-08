import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';

const urls = [
  'https://images.unsplash.com/photo-1548263594-a71ea65a8598?w=1000&q=80',
  'https://images.unsplash.com/photo-1445543949571-ffc3e0e2f55e?w=1000&q=80',
  'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1000&q=80',
  'https://images.unsplash.com/photo-1490750967868-88cb4ecb0701?w=1000&q=80',
  'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1000&q=80',
  'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1000&q=80',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1000&q=80',
  'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1000&q=80',
  'https://images.unsplash.com/photo-1444459094717-a29ee5e46115?w=1000&q=80',
  'https://images.unsplash.com/photo-1506764585324-7389a957ee07?w=1000&q=80',
  'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1000&q=80',
  'https://images.unsplash.com/photo-1517594422361-5e1f087a0422?w=1000&q=80'
];

async function download() {
  const dir = path.join(process.cwd(), 'public', 'images');
  if (!fs.existsSync(dir)){
      fs.mkdirSync(dir, { recursive: true });
  }

  for (let i = 0; i < urls.length; i++) {
    const res = await fetch(urls[i]);
    const buffer = await res.arrayBuffer();
    const filename = `month-${String(i + 1).padStart(2, '0')}.png`;
    fs.writeFileSync(path.join(dir, filename), Buffer.from(buffer));
    console.log(`Downloaded ${filename}`);
  }
}

download();
