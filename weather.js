exports.weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=OMSK&appid=${process.env.WEATHER_TOKEN}&lang=ru&units=metric`;

exports.iconMap = new Map([
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