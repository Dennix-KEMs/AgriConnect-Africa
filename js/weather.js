const currentWeatherCard =
    document.getElementById("currentWeatherCard");

const forecastCard =
    document.getElementById("forecastCard");

const farmAdviceCard =
    document.getElementById("farmAdviceCard");

// Default location (Nairobi)
const DEFAULT_LOCATION = {
    latitude: -1.286389,
    longitude: 36.817223,
    name: "Nairobi"
};


document.addEventListener("DOMContentLoaded", () => {

    loadHomepageWeather();

    if (
        !localStorage.getItem(
            "weatherLocationPromptDismissed"
        )
    ) {

        setTimeout(showLocationPrompt, 3000);

    }

});

function getWeatherTheme(weather) {

    if (!weather.current.isDay) {

        return "weather-night";

    }

    const weatherName =
        weather.current.weather.toLowerCase();

    if (weatherName.includes("rain") ||
        weatherName.includes("drizzle") ||
        weatherName.includes("thunder")) {

        return "weather-rain";

    }

    if (weatherName.includes("cloud")) {

        return "weather-cloudy";

    }

    return "weather-sunny";

}

/**
 * Load weather
 */
async function loadHomepageWeather() {

    try {

        showLoading(
            currentWeatherCard,
            "🌤 Loading current weather..."
        );

        showLoading(
            forecastCard,
            "🌦 Loading weekly forecast..."
        );

        showLoading(
            farmAdviceCard,
            "🌱 Preparing farm intelligence..."
        );

        const weather =
            await fetchWeather(
                DEFAULT_LOCATION.latitude,
                DEFAULT_LOCATION.longitude
            );

        renderCurrentWeather(
            weather,
            DEFAULT_LOCATION.name
        );

        renderForecast(
            weather.forecast
        );

        renderFarmAdvice(
            weather
        );

    } catch (error) {

        console.error(error);

        currentWeatherCard.innerHTML = `
            <div class="weather-error">
                Unable to load weather.
            </div>
        `;

    }

}

/**
 * Fetch weather from backend
 */
async function fetchWeather(latitude, longitude) {

    const response = await fetch(

        `${window.API_BASE_URL}/weather/current?latitude=${latitude}&longitude=${longitude}`

    );

    const result = await response.json();

    if (!response.ok) {

        throw new Error(result.message);

    }

    return result.data;

}

/**
 * Loading
 */
function showLoading(element, message) {

    element.innerHTML = `
        <div class="weather-loading">
            <h3>${message}</h3>
        </div>
    `;

}


function renderForecast(forecast) {

    forecastCard.innerHTML = `

        <h3>🌦 Weekly Forecast</h3>

        <div class="forecast-grid">

            ${forecast.map(day => `

                <div class="forecast-day">

                    <strong>${day.day}</strong>

                    <div>${day.icon}</div>

                    <div>${Math.round(day.maxTemperature)}°</div>

                    <small>${Math.round(day.minTemperature)}°</small>

                </div>

            `).join("")}

        </div>

    `;

}

    function formatTime(dateTime) {

    return new Date(dateTime).toLocaleTimeString(
        [],
        {

            hour: "2-digit",

            minute: "2-digit"

        }

    );

}

function getBrowserLocation() {

    if (!navigator.geolocation) {

        alert("Geolocation is not supported.");

        return;

    }

    navigator.geolocation.getCurrentPosition(

        async (position) => {

            const latitude =
                position.coords.latitude;

            const longitude =
                position.coords.longitude;

            try {

                showLoading(
    currentWeatherCard,
    "🌤 Loading current weather..."
);

showLoading(
    forecastCard,
    "🌦 Updating forecast..."
);

showLoading(
    farmAdviceCard,
    "🌱 Updating recommendations..."
);

const weather =
    await fetchWeather(
        latitude,
        longitude
    );

const location =
    await fetchNearestLocation(
        latitude,
        longitude
    );

renderCurrentWeather(

    weather,

    `${location.ward}, ${location.sub_county}`

);

renderForecast(
    weather.forecast
);

renderFarmAdvice(
    weather
);

            } catch (error) {

                console.error(error);

            }

        },

        () => {

            alert(
                "Unable to access your location."
            );

        }

    );

}

function renderCurrentWeather(weather, locationName) {

    const theme =
    getWeatherTheme(weather);

currentWeatherCard.className =
    `weather-card ${theme}`;

    currentWeatherCard.innerHTML = `

    <div class="weather-icon">

        ${weather.current.icon}

    </div>

    <div class="weather-temp">

        ${Math.round(weather.current.temperature)}°C

    </div>

    <p class="weather-description">

        ${weather.current.weather}

    </p>

    <p>

        📍 ${locationName}

    </p>

    <div class="weather-details">

        <div>

            💧<br>

            <strong>${weather.current.humidity}%</strong>

        </div>

        <div>

            🌬<br>

            <strong>${weather.current.windSpeed} km/h</strong>

        </div>

        <div>

            🌧<br>

            <strong>${weather.forecast[0].rainProbability}%</strong>

        </div>

    </div>

    <br>

    <button
    id="useLocationBtn"
    class="btn btn-green">

    🌍 Show Weather Near Me

</button>

    <br><br>

    <small>

        Updated
        ${formatTime(weather.current.updatedAt)}

    </small>

`;

    document
        .getElementById("useLocationBtn")
        .addEventListener(
            "click",
            getBrowserLocation
        );

}

function renderFarmAdvice(weather) {

    const advice = [];

    const rain =
        weather.forecast[0].rainProbability;

    const humidity =
        weather.current.humidity;

    const wind =
        weather.current.windSpeed;

    if (rain >= 70) {

        advice.push({
            icon: "💧",
            title: "Irrigation",
            text: "Rain expected. Skip irrigation today."
        });

    } else {

        advice.push({
            icon: "💧",
            title: "Irrigation",
            text: "Little rainfall expected. Irrigation is recommended."
        });

    }

    if (wind > 20) {

        advice.push({
            icon: "🧴",
            title: "Spraying",
            text: "Avoid spraying due to strong winds."
        });

    } else {

        advice.push({
            icon: "🧴",
            title: "Spraying",
            text: "Weather is suitable for spraying."
        });

    }

    if (humidity > 90) {

        advice.push({
            icon: "🍅",
            title: "Disease Risk",
            text: "High humidity. Monitor crops for fungal diseases."
        });

    }

    if (weather.current.temperature >= 24 &&
        rain >= 40) {

        advice.push({
            icon: "🌽",
            title: "Planting",
            text: "Good conditions for planting maize."
        });

    }

    farmAdviceCard.innerHTML = `

        <h3>🌱 Farm Intelligence</h3>

        ${advice.map(item => `

            <div class="farm-advice-item">

                <span>${item.icon}</span>

                <div>

                    <strong>${item.title}</strong>

                    <p>${item.text}</p>

                </div>

            </div>

        `).join("")}

    `;

}
document
    .getElementById("confirmLocationBtn")
    .addEventListener("click", () => {

        hideLocationPrompt();

        getBrowserLocation();

    });

document
    .getElementById("dismissLocationBtn")
    .addEventListener("click", () => {

        localStorage.setItem(
            "weatherLocationPromptDismissed",
            "true"
        );

        hideLocationPrompt();

    });

function showLocationPrompt(){

    document
        .getElementById("locationPrompt")
        .classList.remove("hidden");

}

function hideLocationPrompt(){

    document
        .getElementById("locationPrompt")
        .classList.add("hidden");

}

setInterval(() => {

    loadHomepageWeather();

}, 600000);

async function fetchNearestLocation(
    latitude,
    longitude
) {

    const response = await fetch(

        `${window.API_BASE_URL}/locations/nearest?latitude=${latitude}&longitude=${longitude}`

    );

    const result = await response.json();

    if (!response.ok) {

        throw new Error(result.message);

    }

    return result.location;

}