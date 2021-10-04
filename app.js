require('dotenv').config()
const { Telegraf } = require('telegraf');
const axios = require('axios');
const cron = require('node-schedule');
const rssParser = require('rss-parser');
const mariadb = require('mariadb');

const rssUrl = 'https://xn--80axf.xn--b1aew.xn--p1ai/Press-sluzhba/Novosti/rss';
const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=OMSK&appid=${process.env.WEATHER_TOKEN}&lang=ru&units=metric`;

const localConn = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PWD,
    database: process.env.DB_DB,
    acquireTimeout: 1000
};

const herokuConn = {
    host: process.env.CLEARDB_HOST,
    user: process.env.CLEARDB_USER,
    password: process.env.CLEARDB_PWD,
    database: process.env.CLEARDB_DB,
    acquireTimeout: 1000
};

let iconMap = new Map([
    ["01d", "🌞"],
    ["02d", "🌤"],
    ["03d", "⛅️"],
    ["04d", "🌥"],
    ["09d", "🌧"],
    ["10d", "🌦"],
    ["11d", "⛈"],
    ["13d", "🌨"],
    ["50d", "🌫"],
]);

const bot = new Telegraf(process.env.BOT_TOKEN);
const chatId = '-1001154177129';
bot.launch();

const jobNews = async function () {
    const parser = new rssParser({ timeout: 1000 });
    let conn;
    try {
        conn = await mariadb.createConnection(herokuConn);
        const feed = await parser.parseURL(rssUrl);
        let items = feed.items.slice(0, 5);
        items.reverse();

        const [lastRead] = await conn.query("SELECT datetime FROM newsbot LIMIT 1");
        let latestPubDate = 0;

        items.forEach(item => {
            let pubDate = new Date(item.pubDate).getTime();
            if (lastRead.datetime < pubDate) {
                let str = `<b>Новости ОмА МВД России >> <a href="${item.link}">${item.title} </a></b>\n${item.content}\n<a href="${item?.enclosure?.url}">&#8205;</a>`;
                bot.telegram.sendMessage(chatId, str, { parse_mode: "HTML" });
            }
            latestPubDate = Math.max(latestPubDate, pubDate);
        });

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

taskNews = cron.scheduleJob('*/15 * * * *', jobNews);
taskWeather = cron.scheduleJob('*/60 9-19 * * *', jobWeather);

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));