const scrapeVucfEvents = require('./scrape');

(async () => {
  const events = await scrapeVucfEvents();
  console.log(events);
})();
 
