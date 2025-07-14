// server.js

const express = require('express');
const cors = require('cors');
const axios = require('axios');
import 'dotenv/config'; // Load environment variables from .env file

// ===================== Hugging Face AI Categorization Utility =====================
const HF_API_URL = 'https://api-inference.huggingface.co/models/bhadresh-savani/distilbert-base-uncased-emotion'; // or your model
const HF_API_KEY = process.env.HF_API_KEY;

/**
 * Get a category label from Hugging Face AI for a given HTML string.
 * @param {string} html - The HTML content to categorize
 * @returns {Promise<string>} - The predicted label or 'Uncategorized'
 */
async function getCategoryFromAI(html) {
  try {
    const response = await axios.post(
      HF_API_URL,
      { inputs: html },
      {
        headers: {
          Authorization: `Bearer ${HF_API_KEY}`
        }
      }
    );

    // Check format and return label
    const label = response.data?.[0]?.label || 'Uncategorized';
    return label;

  } catch (err) {
    console.error('[AI Error]', err.message);
    return 'Uncategorized';
  }
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

    for (let el of elements.slice(0, 20)) {
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

          return { xpath: segs(el).join('/'), html: el.outerHTML };
        }
        return getXPath(el);
      }, el);

      const category = await getCategoryFromAI(data.html);
      xpaths.push({ ...data, category });
    }



    await browser.close();

    return res.json({ xpaths });

  } catch (err) {
    console.error('[Scraping Failed]', err.message);
    return res.status(500).json({ error: 'Scraping failed. Try another site or check logs.' });
  }
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
