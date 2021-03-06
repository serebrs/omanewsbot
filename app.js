require('dotenv').config()
const { Telegraf } = require('telegraf');
const cron = require('node-schedule');
const { getWeather } = require('./weather');
const { getNews } = require('./news');

const bot = new Telegraf(process.env.BOT_TOKEN);
const chatId = process.env.TELEGRAM_CHAT_ID;

bot.launch();

try {
    taskNews = cron.scheduleJob('*/5 * * * *', async () => await jobSend(getNews));
    taskWeather = cron.scheduleJob('*/60 9-19 * * *', async () => await jobSend(getWeather));
}
catch(err) {
    console.log(err);
}

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

async function jobSend(funcGetData) {
    const data = await funcGetData();
    if (!data) return;
    for (let item of data) {
        await bot.telegram.sendMessage(chatId, item, { parse_mode: "HTML" });
        await new Promise(res => setTimeout(res, 1500)); // задержка между отправками сообщений
    }
}