const rssParser = require('rss-parser');
const mariadb = require('mariadb');
const { localConn, herokuConn } = require('./db');

const rssUrl = 'https://xn--80axf.xn--b1aew.xn--p1ai/Press-sluzhba/Novosti/rss';

exports.getNews = async function () {
    const parser = new rssParser({ timeout: 1000 });
    let conn;
    try {
        let newsArr = [];
        conn = await mariadb.createConnection(herokuConn);
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
                newsArr.push(str);
            }
            latestPubDate = Math.max(latestPubDate, pubDate);
        }
        await conn.query("UPDATE newsbot SET datetime = ?", [latestPubDate]);
        return newsArr;
    }
    catch (err) {
        console.log(err);
        return undefined;
    }
    finally {
        if (conn) await conn.end();
    }
}