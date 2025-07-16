// server.js

const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config(); // Load environment variables from .env file


// ===================== Simple JS Categorization Utility =====================
function categorizeElement(tag, type, html) {
  if (tag === 'button' || (tag === 'input' && type === 'button')) return 'Button';
  if (tag === 'input' && (!type || type === 'text' || type === 'password' || type === 'email')) return 'Input Field';
  if (tag === 'textarea') return 'Input Field';
  if (tag === 'a') return 'Text Field';
  if (tag === 'label' || tag === 'span' || tag === 'p' || tag === 'h1' || tag === 'h2' || tag === 'h3' || tag === 'h4' || tag === 'h5' || tag === 'h6' || tag === 'div') return 'Text Field';
  return 'Other';
}

// ✅ Stealth Puppeteer Setup
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const app = express();
app.use(cors());
app.use(express.json());

// ✅ API Route to Scrape XPaths
app.post('/api/scrape-xpaths', async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    // ✅ Launch Stealth Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

    // ✅ Extract XPaths, HTML, and AI Category
    const elements = await page.$$('*');
    const xpaths = [];
    let aiErrors = 0;


    for (let el of elements.slice(0, 100)) {
      const data = await page.evaluate(el => {
        function getXPath(el) {
          const idx = (sib, name) =>
            sib
              ? idx(sib.previousElementSibling, name || sib.localName) +
                (sib.localName == name)
              : 1;

          const segs = el =>
            !el || el.nodeType !== 1
              ? ['']
              : el.id && document.getElementById(el.id) === el
              ? [`id("${el.id}")`]
              : [
                  ...segs(el.parentNode),
                  `${el.localName.toLowerCase()}[${idx(el)}]`
                ];

          // Compose a name for display
          let name = el.localName.toLowerCase();
          if (el.id) name += `#${el.id}`;
          if (el.name) name += `[name='${el.name}']`;
          if (el.type) name += `[type='${el.type}']`;
          if (el.innerText && el.innerText.trim().length > 0 && el.innerText.trim().length < 40) name += `: ${el.innerText.trim()}`;

          return {
            xpath: segs(el).join('/'),
            html: el.outerHTML,
            tag: el.localName.toLowerCase(),
            type: el.type || '',
            name
          };
        }
        return getXPath(el);
      }, el);

      const category = categorizeElement(data.tag, data.type, data.html);
      xpaths.push({ ...data, category });
    }

    await browser.close();

    const logs = `Scraped ${xpaths.length} elements from ${url}. AI errors: ${aiErrors}`;
    return res.json({ xpaths, logs });

  } catch (err) {
    console.error('[Scraping Failed]', err.message);
    return res.status(500).json({ error: 'Scraping failed. Try another site or check logs.' });
  }
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
