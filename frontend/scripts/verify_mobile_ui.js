import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const artifactDir = 'C:\\Users\\ASUS\\.gemini\\antigravity-ide\\brain\\069923bb-2724-4236-be2a-795d5ab54b73';

const widths = [360, 375, 390, 412, 430];

async function run() {
  console.log('Launching Chrome via puppeteer-core...');
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--no-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();
  await page.evaluateOnNewDocument(() => {
    localStorage.setItem('krishi_lang_selected_once', 'true');
    localStorage.setItem('krishi_lang', 'hi');
  });

  // Navigate to app
  await page.goto('http://127.0.0.1:5173/#/home', { waitUntil: 'networkidle0' });
  console.log('Current page URL:', page.url());

  // Click demo farmer button if on login screen
  const demoFarmerBtn = await page.$('#demo-farmer-btn');
  if (demoFarmerBtn) {
    console.log('Clicking demo-farmer-btn...');
    await demoFarmerBtn.click();
    await page.waitForSelector('#nav-btn-profile-avatar', { timeout: 8000 });
    console.log('Successfully entered Farmer Dashboard!');
  }

  console.log('After login URL:', page.url());

  console.log('Testing viewports for horizontal overflow:');
  const results = {};

  for (const w of widths) {
    await page.setViewport({ width: w, height: 800 });
    await new Promise(r => setTimeout(r, 400));

    const check = await page.evaluate(() => {
      const scrollWidth = document.documentElement.scrollWidth;
      const clientWidth = document.documentElement.clientWidth;
      const bodyScrollWidth = document.body.scrollWidth;
      const rootScrollWidth = document.getElementById('root')?.scrollWidth || 0;

      // Check header content
      const headerText = document.querySelector('header')?.innerText || '';
      const has20AI = headerText.includes('2.0 AI');

      // Check for raw keys anywhere on page
      const bodyText = document.body.innerText;
      const hasRawRealData = bodyText.includes('COMMON.REALDATA');
      const hasRawTapForDetails = bodyText.includes('dashboard.tapForDetails');
      const hasRawConfidence = bodyText.includes('dashboard.confidence');
      const hasRawUpdated = bodyText.includes('dashboard.updated');

      // Check profile avatar initial
      const avatarBtn = document.getElementById('nav-btn-profile-avatar');
      const avatarText = avatarBtn?.innerText?.trim() || '';

      return {
        viewportWidth: window.innerWidth,
        scrollWidth,
        clientWidth,
        bodyScrollWidth,
        rootScrollWidth,
        horizontalOverflow: scrollWidth > clientWidth,
        has20AI,
        hasRawRealData,
        hasRawTapForDetails,
        hasRawConfidence,
        hasRawUpdated,
        avatarText
      };
    });

    results[w] = check;
    console.log(`- Width ${w}px: overflow=${check.horizontalOverflow ? 'FAIL' : 'PASS'} (scrollWidth: ${check.scrollWidth}, clientWidth: ${check.clientWidth})`);
  }

  // Take a full screenshot of the current page
  const debugScreenshotPath = path.join(artifactDir, 'screenshot_current_page.png');
  await page.screenshot({ path: debugScreenshotPath });
  console.log(`Saved page screenshot to: ${debugScreenshotPath}`);

  const pageInfo = await page.evaluate(() => {
    return {
      title: document.title,
      buttons: Array.from(document.querySelectorAll('button')).map(b => ({
        id: b.id,
        text: b.innerText.trim().slice(0, 30),
        className: b.className
      }))
    };
  });
  console.log('Page buttons:', pageInfo.buttons);

  // Capture clean closed-menu dashboard screenshot
  await page.setViewport({ width: 390, height: 844 });
  // Reload clean to ensure no menus open
  await page.goto('http://127.0.0.1:5173/#/home', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 600));

  const screenshotPathDashboard = path.join(artifactDir, 'screenshot_dashboard_390.png');
  await page.screenshot({ path: screenshotPathDashboard });
  console.log(`Saved clean dashboard screenshot to: ${screenshotPathDashboard}`);

  // Now click avatar to take menu screenshot
  const avatarBtn = await page.$('#nav-btn-profile-avatar');
  if (avatarBtn) {
    await avatarBtn.click();
    await new Promise(r => setTimeout(r, 500));
    const screenshotPathMenu = path.join(artifactDir, 'screenshot_profile_menu.png');
    await page.screenshot({ path: screenshotPathMenu });
    console.log(`Saved profile menu screenshot to: ${screenshotPathMenu}`);
  }

  await browser.close();

  console.log('\n--- VERIFICATION SUMMARY ---');
  console.log(JSON.stringify(results, null, 2));
}

run().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
