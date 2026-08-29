const axios = require("axios");

/**
 * Get current weather and 7-day forecast
 */
exports.getWeather = async (latitude, longitude) => {

    try {

        const response = await axios.get(
            "https://api.open-meteo.com/v1/forecast",
            {
                params: {

                    latitude,
                    longitude,

                    current: [
                        "temperature_2m",
                        "relative_humidity_2m",
                        "apparent_temperature",
                        "is_day",
                        "precipitation",
                        "rain",
                        "weather_code",
                        "wind_speed_10m"
                    ].join(","),

                    daily: [
                        "weather_code",
                        "temperature_2m_max",
                        "temperature_2m_min",
                        "precipitation_probability_max"
                    ].join(","),

                    timezone: "auto"

                }
            }
        );

        const forecast = response.data.daily.time.map((date, index) => ({

            date,

            day: new Date(date).toLocaleDateString(
                "en-US",
                { weekday: "short" }
            ),

            icon: getWeatherIcon(
                response.data.daily.weather_code[index]
            ),

            weather: getWeatherDescription(
                response.data.daily.weather_code[index]
            ),

            maxTemperature:
                response.data.daily.temperature_2m_max[index],

            minTemperature:
                response.data.daily.temperature_2m_min[index],

            rainProbability:
                response.data.daily.precipitation_probability_max[index]

        }));


        return {

            current: {

                temperature:
                    response.data.current.temperature_2m,

                humidity:
                    response.data.current.relative_humidity_2m,

                apparentTemperature:
                    response.data.current.apparent_temperature,

                windSpeed:
                    response.data.current.wind_speed_10m,

                rain:
                    response.data.current.rain,

                weather:
                    getWeatherDescription(
                        response.data.current.weather_code
                    ),

                icon:
                    getWeatherIcon(
                        response.data.current.weather_code
                    ),

                isDay:
                    response.data.current.is_day === 1,

                updatedAt:
                    response.data.current.time

            },

            forecast

        };

    } catch (error) {

        console.error(
            "Weather Service Error:",
            error.message
        );

        throw new Error(
            "Unable to fetch weather."
        );

    }

};

function getWeatherDescription(code) {

    const descriptions = {

        0: "Clear Sky",
        1: "Mostly Sunny",
        2: "Partly Cloudy",
        3: "Cloudy",

        45: "Fog",
        48: "Freezing Fog",

        51: "Light Drizzle",
        53: "Moderate Drizzle",
        55: "Heavy Drizzle",

        61: "Light Rain",
        63: "Moderate Rain",
        65: "Heavy Rain",

        71: "Light Snow",
        73: "Snow",
        75: "Heavy Snow",

        80: "Rain Showers",
        81: "Heavy Rain Showers",
        82: "Violent Rain Showers",

        95: "Thunderstorm",
        96: "Thunderstorm with Hail",
        99: "Severe Thunderstorm"

    };

    return descriptions[code] || "Unknown";

}

function getWeatherIcon(code) {

    const icons = {

        0: "☀️",
        1: "🌤",
        2: "⛅",
        3: "☁️",

        45: "🌫️",

        51: "🌦️",
        53: "🌦️",
        55: "🌧️",

        61: "🌧️",
        63: "🌧️",
        65: "⛈️",

        71: "❄️",
        73: "❄️",

        80: "🌦️",
        81: "🌧️",
        82: "⛈️",

        95: "⛈️",
        96: "⛈️",
        99: "⛈️"

    };

    return icons[code] || "🌍";

}
