# VUCF Discord Bot

A bot that automatically posts Volunteer UCF events weekly to a designated Discord channel. Pulls data live from KnightConnect.

## Features
- Weekly event postings via scheduled task (every Monday at 10:00 AM)
- `!vucfevents` command for manual posting of the next two weeks of events
- `!setvucfchannel #channel-name` to designate the server channel for event updates
- Scrapes and displays the first sentence of each event's description for context
- Automatically filters for events occurring within the next 14 days

## Setup

1. **Clone the repository:**
   git clone https://github.com/ZackGroth/vucf-discord-bot.git
   cd vucf-discord-bot
2. **Install dependencies:**
   npm install
3. Create a .env file in the root directory:
   DISCORD_TOKEN=your-discord-bot-token
4. Set the channel on your Discord server by running:
    !setvucfchannel #your-channel-name
5. Run the bot manually (for development):
   node index.js
6. (Optional) Set up the bot to run continuously using a process manager like pm2, or host it on a platform that supports scheduled jobs.

## Development Notes
- The bot uses Puppeteer to scrape KnightConnect for upcoming events and individual event descriptions.
- Time parsing and filtering is handled with Day.js.
- All settings, including per-server channel selections, are stored in channel-settings.json.
   
## Author
  Zack Groth
  
