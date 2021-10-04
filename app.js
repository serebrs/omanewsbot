require('dotenv').config()
const { Telegraf } = require('telegraf');
const cron = require('node-schedule');
const { getWeather } = require('./weather');
const { getNews } = require('./news');

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.launch();

taskNews = cron.scheduleJob('*/5 * * * *', async () => await jobSend(getNews));
taskWeather = cron.scheduleJob('*/60 9-19 * * *', async () => await jobSend(getWeather));

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

const jobSend = async function (funcGetData) {
    const data = await funcGetData();
    if (!data) return;
    for (let item of data) {
        await bot.telegram.sendMessage(process.env.TELEGRAM_CHAT_ID, item, { parse_mode: "HTML" });
    }
}