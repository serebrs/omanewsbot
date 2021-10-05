const axios = require('axios');

const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=OMSK&appid=${process.env.WEATHER_TOKEN}&lang=ru&units=metric`;

const iconMap = new Map([
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

exports.getWeather = async function () {
    try {
        let weatherData = await axios.get(weatherUrl, {timeout: 1000});
        let iconUni = iconMap.get(weatherData.data.weather[0].icon) || "&#8205;";
        let str = `<b>Погода в Омске сейчас >> </b>\n${weatherData.data.weather[0].description}\n<b>${Math.round(weatherData.data.main.temp)}</b> ℃  ${iconUni}`;
        return [str];
    }
    catch (err) { 
        console.log('Error: Не могу загрузить погоду.'); 
        return undefined;
    }
}
