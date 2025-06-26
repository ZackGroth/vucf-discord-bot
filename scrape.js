const puppeteer = require('puppeteer');

async function scrapeVucfEvents() {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();

  await page.goto('https://knightconnect.campuslabs.com/engage/organization/vucf/events', {
    waitUntil: 'domcontentloaded',
  });

  // Wait for dynamic content to load
  await new Promise(resolve => setTimeout(resolve, 5000));

  // Get event name, datetime, and link
  const events = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('a[href*="/event/"]'))
      .filter(el => el.querySelector('h3'));

    return cards.map(card => {
      const name = card.querySelector('h3')?.textContent.trim();
      const datetime = card.innerText.match(/\w+day,.*?(AM|PM)/)?.[0]?.trim();
      const link = card.href;

      return name && datetime && link
        ? { name, datetime, link }
        : null;
    }).filter(Boolean);
  });

  console.log('Raw scraped events:', events); // Debugging

  // Scrape descriptions from each event's individual page
  for (let event of events) {
    try {
      const detailPage = await browser.newPage();
      console.log(`📄 Scraping description for: ${event.name} → ${event.link}`);
      await detailPage.goto(event.link, { waitUntil: 'domcontentloaded' });

      await detailPage.waitForSelector('.DescriptionText p', { timeout: 10000 });

      const description = await detailPage.$eval('.DescriptionText p', el => {
        const firstSentence = el.textContent.trim().split('. ')[0] + '.';
        return firstSentence;
      });

      event.description = description;
      await detailPage.close();
    } catch (err) {
      console.error(`❌ Failed to get description for: ${event.name}`);
      event.description = 'Description unavailable.';
    }
  }

  await browser.close();
  return events;
}

module.exports = scrapeVucfEvents;
