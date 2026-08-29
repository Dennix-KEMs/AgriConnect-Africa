const weatherCard =
    document.getElementById("dashboardCurrentWeather");

const forecastCard =
    document.getElementById("dashboardForecast");

const adviceCard =
    document.getElementById("dashboardFarmAdvice");

const alertsCard =
    document.getElementById("dashboardWeatherAlerts");


document.addEventListener("DOMContentLoaded", () => {

    loadDashboardWeather();

});


async function loadDashboardWeather() {

    try {

        weatherCard.innerHTML =
            "🌤 Loading your farm weather...";

        const token =
            localStorage.getItem("token");

        if (!token) {

            throw new Error(
                "Please log in to view your personalized weather."
            );

        }


        const response =
            await fetch(

                `${window.API_BASE_URL}/weather/farmer`,

                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }

            );


        const result =
            await response.json();


        if (!response.ok) {

            throw new Error(
                result.message ||
                "Unable to load farmer weather."
            );

        }


        renderDashboardWeather(result);


    } catch (error) {

        console.error(
            "Dashboard Weather Error:",
            error
        );


        weatherCard.innerHTML = `

            <div class="weather-error">

                <h3>⚠️ Weather unavailable</h3>

                <p>
                    ${error.message}
                </p>

            </div>

        `;

    }

}


function renderDashboardWeather(result) {

    const weather =
        result.data;

    const location =
        result.location;


    weatherCard.innerHTML = `

        <div class="dashboard-weather-header">

            <div>

                <h2>
                    🌤 My Farm Weather
                </h2>

                <p class="weather-location">

                    📍 ${location.ward},
                    ${location.subCounty},
                    ${location.county}

                </p>

            </div>

        </div>


        <div class="weather-main">

            <div class="weather-icon-large">

                ${weather.current.icon}

            </div>


            <div class="weather-temperature">

                ${Math.round(
                    weather.current.temperature
                )}°C

            </div>


            <h3>

                ${weather.current.weather}

            </h3>

        </div>


        <div class="weather-details">

            <div>

                💧

                <span>Humidity</span>

                <strong>
                    ${weather.current.humidity}%
                </strong>

            </div>


            <div>

                🌬

                <span>Wind</span>

                <strong>
                    ${weather.current.windSpeed} km/h
                </strong>

            </div>


            <div>

                🌧

                <span>Rain</span>

                <strong>
                    ${weather.current.rain} mm
                </strong>

            </div>

        </div>


        <small>

            Updated
            ${new Date(
                weather.current.updatedAt
            ).toLocaleTimeString(
                [],
                {
                    hour: "2-digit",
                    minute: "2-digit"
                }
            )}

        </small>

    `;


    renderForecast(
        weather.forecast
    );


    renderAdvice(
        weather
    );


    renderAlerts(
        weather
    );

}


function renderForecast(forecast) {

    forecastCard.innerHTML = `

        <h3>
            📅 7-Day Forecast
        </h3>

        <div class="forecast-grid">

            ${forecast.map(day => `

                <div class="forecast-day">

                    <strong>
                        ${day.day}
                    </strong>

                    <div>
                        ${day.icon}
                    </div>

                    <div>

                        ${Math.round(
                            day.maxTemperature
                        )}°

                    </div>

                    <small>

                        ${Math.round(
                            day.minTemperature
                        )}°

                    </small>

                    <small>

                        🌧
                        ${day.rainProbability}%

                    </small>

                </div>

            `).join("")}

        </div>

    `;

}


function renderAdvice(weather) {

    const advice = [];

    const rain =
        weather.forecast[0].rainProbability;

    const humidity =
        weather.current.humidity;

    const wind =
        weather.current.windSpeed;


    if (rain >= 70) {

        advice.push(`
            <div class="farm-advice-item">
                💧
                <div>
                    <strong>Irrigation</strong>
                    <p>
                        Significant rainfall is expected.
                        Consider reducing or skipping irrigation.
                    </p>
                </div>
            </div>
        `);

    } else {

        advice.push(`
            <div class="farm-advice-item">
                💧
                <div>
                    <strong>Irrigation</strong>
                    <p>
                        Limited rainfall is expected.
                        Check soil moisture and irrigate if necessary.
                    </p>
                </div>
            </div>
        `);

    }


    if (wind > 20) {

        advice.push(`
            <div class="farm-advice-item">
                🌬
                <div>
                    <strong>Spraying</strong>
                    <p>
                        Strong winds are expected.
                        Avoid spraying at this time.
                    </p>
                </div>
            </div>
        `);

    } else {

        advice.push(`
            <div class="farm-advice-item">
                🧴
                <div>
                    <strong>Spraying</strong>
                    <p>
                        Wind conditions are relatively suitable
                        for spraying.
                    </p>
                </div>
            </div>
        `);

    }


    if (humidity >= 85) {

        advice.push(`
            <div class="farm-advice-item">
                🌱
                <div>
                    <strong>Crop Health</strong>
                    <p>
                        High humidity may increase disease risk.
                        Monitor crops closely.
                    </p>
                </div>
            </div>
        `);

    }


    adviceCard.innerHTML = `

        <h3>
            🌱 Farm Intelligence
        </h3>

        ${advice.join("")}

    `;

}


function renderAlerts(weather) {

    const alerts = [];

    const rain =
        weather.forecast[0].rainProbability;

    const wind =
        weather.current.windSpeed;

    const temperature =
        weather.current.temperature;


    if (rain >= 80) {

        alerts.push(`
            <div class="weather-alert">
                🌧️
                <strong>
                    High Rainfall Probability
                </strong>
                <p>
                    Rain is highly likely today.
                    Plan outdoor farm activities accordingly.
                </p>
            </div>
        `);

    }


    if (wind >= 30) {

        alerts.push(`
            <div class="weather-alert">
                🌬️
                <strong>
                    Strong Winds
                </strong>
                <p>
                    Consider postponing spraying and
                    other wind-sensitive activities.
                </p>
            </div>
        `);

    }


    if (temperature >= 35) {

        alerts.push(`
            <div class="weather-alert">
                🌡️
                <strong>
                    High Temperature
                </strong>
                <p>
                    Monitor crops and livestock for
                    heat stress.
                </p>
            </div>
        `);

    }


    if (!alerts.length) {

        alerts.push(`
            <div class="weather-alert weather-alert-normal">
                ✅
                <strong>
                    No major weather alerts
                </strong>
                <p>
                    Conditions currently look relatively stable.
                </p>
            </div>
        `);

    }


    alertsCard.innerHTML = `

        <h3>
            ⚠️ Weather Alerts
        </h3>

        ${alerts.join("")}

    `;

}