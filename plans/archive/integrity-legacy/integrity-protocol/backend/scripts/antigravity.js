import { chromium } from 'playwright';
import path from 'path';
import os from 'os';
import { saveVideo } from 'playwright-video';
import ffmpegPath from 'ffmpeg-static';

async function run() {
  const profilePath = path.join(os.homedir(), '.gemini', 'antigravity-browser-profile');
  
  console.log('🚀 Launching Antigravity Mode (Headful Browser)...');

  const context = await chromium.launchPersistentContext(profilePath, {
    headless: false,
    viewport: { width: 1440, height: 900 },
    args: ['--start-maximized']
  });

  const page = context.pages().length > 0 ? context.pages()[0] : await context.newPage();
  await page.goto('http://localhost:5173/dashboard?guest=true', { waitUntil: 'networkidle' });

  // Add agent-locked yellow border overlay
  await page.addStyleTag({
    content: `
      body::after {
        content: "";
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        border: 8px solid #d4af37;
        pointer-events: none;
        box-sizing: border-box;
        z-index: 999999;
      }
      body {
        pointer-events: none !important;
        user-select: none !important;
      }
    `
  });

  let recorder = null;
  
  // Screenshot functionality
  await page.exposeFunction('captureScreenshot', async () => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputPath = path.join(process.cwd(), 'artifacts', `screenshot-${timestamp}.png`);
    await page.screenshot({ path: outputPath });
    console.log(`📸 Screenshot saved: ${outputPath}`);
  });

  // Recording functionality
  await page.exposeFunction('toggleRecording', async () => {
    if (recorder) {
      await recorder.stop();
      recorder = null;
      console.log('🎥 Recording stopped.');
    } else {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const outputPath = path.join(process.cwd(), 'artifacts', `record-${timestamp}.mp4`);
      recorder = await saveVideo(page, outputPath, { ffmpegPath });
      console.log(`🎥 Recording started: ${outputPath}`);
    }
  });

  await page.evaluate(() => {
    window.addEventListener('keydown', async (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        await window.captureScreenshot();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'r') {
        e.preventDefault();
        await window.toggleRecording();
      }
    });
  });

  console.log('✨ Antigravity Mode Active.');
  console.log('📸 Press Ctrl+S to take a screenshot.');
  console.log('🎥 Press Ctrl+R to start/stop screen recording.');
  console.log('Press Ctrl+C in this terminal to close the session.');

  await new Promise(() => {});
}

run().catch(err => {
  console.error('❌ Failed to launch Antigravity Mode:', err);
  process.exit(1);
});
