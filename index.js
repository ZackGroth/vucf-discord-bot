require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const scrapeVucfEvents = require('./scrape');
const cron = require('node-cron');
const dayjs = require('dayjs');
const customParseFormat = require('dayjs/plugin/customParseFormat');
dayjs.extend(customParseFormat);

const fs = require('fs');
const SETTINGS_FILE = './channel-settings.json';

let channelSettings = fs.existsSync(SETTINGS_FILE)
  ? JSON.parse(fs.readFileSync(SETTINGS_FILE))
  : {};

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.once('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

  // Run every Monday at 10:00 AM
  cron.schedule('0 10 * * 1', async () => {
  //cron.schedule('* * * * *', async () => { //to test
    console.log('⏰ Running weekly event post');

    const events = await getUpcomingEvents();

    if (events.length === 0) {
      console.log('ℹ️ No upcoming events to post.');
      return;
    }

    client.guilds.cache.forEach(async (guild) => {
      const channelId = channelSettings[guild.id];
      if (!channelId) {
        console.log(`⚠️ No channel set for ${guild.name}. Use !setvucfchannel`);
        return;
      }

      let channel;
      try {
        channel = await client.channels.fetch(channelId);
      } catch (err) {
        console.log(`❌ Failed to fetch channel for ${guild.name}: ${err}`);
        return;
      }


      if (!channel) {
        console.log(`⚠️ No volunteer-opportunities channel in ${guild.name}`);
        return;
      }

      await channel.send('📣 **Upcoming Volunteer UCF Events:**');

      for (const event of events) {
        await channel.send({
          embeds: [{
            title: event.name,
            url: event.link,
            description: `🕒 ${event.datetime}\n\n${(event.description.match(/.*?[.?!](?=\s|$)/) || [event.description])[0]}`,
            color: 0x008000
          }]
        });
      }
      console.log(`✅ Posted to ${guild.name}`);
    });
  });
});

client.on('messageCreate', async (message) => {
    if (message.content.startsWith('!setvucfchannel')) {
    const mentionedChannel = message.mentions.channels.first();
    if (!mentionedChannel) {
      return message.reply('⚠️ Please mention a valid channel like `#volunteer-opportunities`.');
    }

    // Save the selected channel for the guild
    channelSettings[message.guild.id] = mentionedChannel.id;
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(channelSettings, null, 2));
    return message.reply(`✅ Set this server's VUCF post channel to ${mentionedChannel}.`);
  }
  if (message.content === '!vucfevents') {
    const events = await getUpcomingEvents();

    if (events.length === 0) {
      return message.channel.send('😕 No VUCF events in the next 2 weeks.');
    }

    await message.channel.send('📣 **Upcoming Volunteer UCF Events:**');

    for (const event of events) {
      await message.channel.send({
        embeds: [{
          title: event.name,
          url: event.link,
          description: `🕒 ${event.datetime}\n\n${(event.description.match(/.*?[.?!](?=\s|$)/) || [event.description])[0]}`,
          color: 0x008000
        }]
      });
    }
  }
});

async function getUpcomingEvents() {
  let events = await scrapeVucfEvents();
  const today = dayjs();

  events = events.filter(event => {
    const cleanedDatetime = event.datetime
      .replace(/^.*?,\s*/, '')
      .replace(/\s*EDT$/, '')
      .trim();

    const parsed = dayjs(cleanedDatetime, 'MMMM D [at] h:mmA');
    if (!parsed.isValid()) return false;

    const diff = parsed.diff(today, 'day');
    return diff >= 0 && diff <= 14;
  });

  return events;
}

client.login(process.env.DISCORD_TOKEN);
