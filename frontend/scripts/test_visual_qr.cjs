const puppeteer = require('puppeteer-core');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');
const jsQR = require('jsqr');

const distDir = path.resolve('dist');
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.json': 'application/json'
};

const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/' || reqPath === '') reqPath = '/index.html';
  let filePath = path.join(distDir, reqPath);
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(distDir, 'index.html');
  }
  const ext = path.extname(filePath);
  const contentType = mimeTypes[ext] || 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': contentType });
  fs.createReadStream(filePath).pipe(res);
});

server.listen(4180, async () => {
  console.log('Test server running on http://localhost:4180');
  try {
    const browser = await puppeteer.launch({
      executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });
    await page.goto('http://localhost:4180/#/home', { waitUntil: 'networkidle0' });

    // Wait for the scan-to-visit-card element
    await page.waitForSelector('#scan-to-visit-card', { timeout: 10000 });
    console.log('SUCCESS: Found #scan-to-visit-card in DOM!');

    // Get QR image element
    const qrImg = await page.$('#scan-to-visit-card img');
    const qrBox = await qrImg.boundingBox();
    console.log('SUCCESS: QR Image Bounding Box in browser:', qrBox);

    // Take screenshot of the QR code element
    const artifactDir = 'C:/Users/ASUS/.gemini/antigravity-ide/brain/bb22089a-d784-4f4a-93bd-2c3d6c2664e6';
    const qrCropPath = path.join(artifactDir, 'visible_qr_screenshot.png');
    await qrImg.screenshot({ path: qrCropPath });
    console.log('Saved visible QR screenshot to:', qrCropPath);

    // Take landing page screenshot
    const fullPagePath = path.join(artifactDir, 'landing_page_with_qr.png');
    await page.screenshot({ path: fullPagePath, fullPage: false });
    console.log('Saved landing page screenshot to:', fullPagePath);

    // Decode the cropped screenshot using jsQR
    const imgData = fs.readFileSync(qrCropPath);
    const png = PNG.sync.read(imgData);
    const decoded = jsQR(new Uint8ClampedArray(png.data), png.width, png.height);
    console.log('DECODED_FROM_BROWSER_SCREENSHOT:', decoded ? decoded.data : 'FAILED');

    // Check link text and href
    const linkHref = await page.$eval('#link-scan-to-visit', el => el.href);
    console.log('SUCCESS: Link href in browser DOM:', linkHref);

    // Also check button states
    const downloadBtn = await page.$('#btn-scan-card-download');
    console.log('SUCCESS: Download button present:', !!downloadBtn);

    const copyBtn = await page.$('#btn-scan-card-copy');
    console.log('SUCCESS: Copy button present:', !!copyBtn);

    await browser.close();
    server.close();
    process.exit(0);
  } catch (err) {
    console.error('Puppeteer verification failed:', err);
    server.close();
    process.exit(1);
  }
});
