require('dotenv').config()
const { Telegraf } = require('telegraf');
const axios = require('axios');
const cron = require('node-schedule');
const rssParser = require('rss-parser');
const mariadb = require('mariadb');
const { localConn, herokuConn } = require('./db');
const { weatherUrl, iconMap } = require('./weather');

const rssUrl = 'https://xn--80axf.xn--b1aew.xn--p1ai/Press-sluzhba/Novosti/rss';

const bot = new Telegraf(process.env.BOT_TOKEN);
const chatId = process.env.TELEGRAM_CHAT_ID;

bot.launch();

const jobNews = async function () {
    const parser = new rssParser({ timeout: 1000 });
    let conn;
    try {
        conn = await mariadb.createConnection(localConn);
        const feed = await parser.parseURL(rssUrl);
        let items = feed.items.slice(0, 3);
        items.reverse();
        const [lastRead] = await conn.query("SELECT datetime FROM newsbot LIMIT 1");
        const lastDatetime = lastRead?.datetime || 0;
        let latestPubDate = 0;
        for (let item of items) {
            let pubDate = new Date(item.pubDate).getTime();
            if (lastDatetime < pubDate) {
                let str = `<b>Новости ОмА МВД России >> <a href="${item.link}">${item.title} </a></b>\n${item.content}\n<a href="${item?.enclosure?.url}">&#8205;</a>`;
                await bot.telegram.sendMessage(chatId, str, { parse_mode: "HTML" });
            }
            latestPubDate = Math.max(latestPubDate, pubDate);
        }
        await conn.query("UPDATE newsbot SET datetime = ?", [latestPubDate]);
    }
    catch (err) {
        console.log(err);
    }
    finally {
        if (conn) await conn.end();
    }
}

const jobWeather = async function () {
    try {
        let weatherData = await axios.get(weatherUrl);
        let iconUni = iconMap.get(weatherData.data.weather[0].icon) || "&#8205;";
        let str = `<b>Погода в Омске сейчас >> </b>\n${weatherData.data.weather[0].description}\n<b>${Math.round(weatherData.data.main.temp)}</b> ℃  ${iconUni}`;
        bot.telegram.sendMessage(chatId, str, { parse_mode: "HTML" });
    }
    catch (err) { console.log(err); }
}

//taskNews = cron.scheduleJob('*/15 * * * *', jobNews);
//taskWeather = cron.scheduleJob('*/60 9-19 * * *', jobWeather);
taskNews = cron.scheduleJob('*/15 * * * * *', jobNews);
taskWeather = cron.scheduleJob('*/30 * * * * *', jobWeather);

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));