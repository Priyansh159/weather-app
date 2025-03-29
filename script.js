// API Key
const API_KEY = "168771779c71f3d64106d8a88376808a";

// Tab Switching 
const userTab = document.querySelector("[data-userWeather]");
const searchTab = document.querySelector("[data-searchWeather]");
const searchForm = document.querySelector("[data-searchForm]");
const userInfoContainer = document.querySelector(".userInfoContainer");
const grantAccessContainer = document.querySelector(
    ".grantLocationContainer"
);
const loadingContainer = document.querySelector('.loadingContainer');

const notFound = document.querySelector('.errorContainer');
const errorBtn = document.querySelector('[data-errorButton]');
const errorText = document.querySelector('[data-errorText]');
const errorImage = document.querySelector('[data-errorImg]');

// Get elements
const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const recentCitiesDropdown = document.getElementById("recentCitiesDropdown");

let currentTab = userTab;
currentTab.classList.add("currentTab");
getFromSessionStorage();

function switchTab(newTab) {
    notFound.classList.remove("active");
    if (currentTab != newTab) {
        currentTab.classList.remove("currentTab");
        currentTab = newTab;
        currentTab.classList.add("currentTab");

        if (!searchForm.classList.contains("active")) {
            searchForm.classList.add("active");
            userInfoContainer.classList.remove("active");
            grantAccessContainer.classList.remove("active");
        }
        else {
            searchForm.classList.remove("active");
            userInfoContainer.classList.remove("active");
            getFromSessionStorage();
        }
    }
}

userTab.addEventListener('click', () => {
    switchTab(userTab);
});

searchTab.addEventListener('click', () => {
    switchTab(searchTab);
});

function getFromSessionStorage() {
    const localCoordinates = sessionStorage.getItem("userCoordinates");
    if (!localCoordinates) {
        grantAccessContainer.classList.add('active');
    }
    else {
        const coordinates = JSON.parse(localCoordinates);
        fetchWeatherInfo(coordinates);
    }
}

async function fetchWeatherInfo(coordinates) {
    const { lat, lon } = coordinates;
    grantAccessContainer.classList.remove('active');
    loadingContainer.classList.add('active');

    try {
        const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`);
        const data = await response.json();
        if (!data.sys) {
            throw data;
        }
        loadingContainer.classList.remove('active');
        userInfoContainer.classList.add('active');
        renderWeatherInfo(data);
        fetchExtendedForecast(lat, lon);
    }
    catch (err) {
        loadingContainer.classList.remove('active');
        notFound.classList.add('active');
        errorText.innerText = `Error: ${err?.message}`;
    }
}

async function fetchExtendedForecast(lat, lon) {
    try {
        const response = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`);
        const data = await response.json();
        if (!data.list) {
            throw data;
        }
        renderExtendedForecast(data.list);
    } catch (err) {
        console.error("Error fetching extended forecast:", err);
    }
}

function renderWeatherInfo(weatherInfo) {
    const cityName = document.querySelector('[data-cityName]');
    const countryFlag = document.querySelector('[data-countryFlag]');
    const description = document.querySelector('[data-weatherDesc]');
    const weatherIcon = document.querySelector('[data-weatherIcon]');
    const temp = document.querySelector('[data-temp]');
    const windspeed = document.querySelector('[data-windspeed]');
    const humidity = document.querySelector('[data-humidity]');
    const clouds = document.querySelector('[data-clouds]');

    cityName.innerText = weatherInfo?.name;
    countryFlag.src = `https://flagcdn.com/144x108/${weatherInfo?.sys?.country.toLowerCase()}.png`;
    description.innerText = weatherInfo?.weather?.[0]?.description;
    weatherIcon.src = `http://openweathermap.org/img/w/${weatherInfo?.weather?.[0]?.icon}.png`;
    temp.innerText = `${weatherInfo?.main?.temp.toFixed(2)} °C`;
    windspeed.innerText = `${weatherInfo?.wind?.speed.toFixed(2)} m/s`;
    humidity.innerText = `${weatherInfo?.main?.humidity.toFixed(2)} %`;
    clouds.innerText = `${weatherInfo?.clouds?.all.toFixed(2)} %`;
}

const grantAccessButton = document.querySelector('[data-grantAccess]');

function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(showPosition);
    }
    else {
        grantAccessButton.style.display = 'none';
    }
}

function showPosition(position) {
    const userCoordinates = {
        lat: position.coords.latitude,
        lon: position.coords.longitude
    };
    sessionStorage.setItem("userCoordinates", JSON.stringify(userCoordinates));
    fetchWeatherInfo(userCoordinates);
}

grantAccessButton.addEventListener('click', getLocation);

// Function to get stored cities
function getRecentCities() {
    return JSON.parse(localStorage.getItem("recentCities")) || [];
}

// Function to store a searched city
function saveCity(city) {
    let cities = getRecentCities();
    if (!cities.includes(city)) {
        cities.unshift(city);
        if (cities.length > 5) cities.pop();
        localStorage.setItem("recentCities", JSON.stringify(cities));
    }
}

// Function to display dropdown
function updateDropdown() {
    recentCitiesDropdown.innerHTML = "";
    const cities = getRecentCities();
    
    if (cities.length === 0) {
        recentCitiesDropdown.classList.add("hidden");
        return;
    }
    
    recentCitiesDropdown.classList.remove("hidden");

    cities.forEach(city => {
        const li = document.createElement("li");
        li.textContent = city;
        li.classList.add("cursor-pointer", "p-2", "hover:bg-gray-200");
        li.addEventListener("click", () => {
            cityInput.value = city;
            fetchSearchWeatherInfo(city); // Fetch weather for selected city
        });
        recentCitiesDropdown.appendChild(li);
    });
}

// Search for weather
const searchInput = document.querySelector('[data-searchInput]');

searchBtn.addEventListener("click", () => {
    const city = cityInput.value.trim();
    if (city) {
        saveCity(city);
        fetchSearchWeatherInfo(city);
        updateDropdown();
    }
});

searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (searchInput.value === "") {
        return;
    }
    fetchSearchWeatherInfo(searchInput.value);
    searchInput.value = "";
});

// Load recent cities on page load
window.addEventListener("DOMContentLoaded", updateDropdown);

async function fetchSearchWeatherInfo(city) {
    loadingContainer.classList.add("active");
    userInfoContainer.classList.remove("active");
    grantAccessContainer.classList.remove("active");
    notFound.classList.remove("active");
    try {
        const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`);
        const data = await response.json();
        if (!data.sys) {
            throw data;
        }
        loadingContainer.classList.remove('active');
        userInfoContainer.classList.add('active');
        renderWeatherInfo(data);
        fetchExtendedForecast(data.coord.lat, data.coord.lon);
    }
    catch (err) {
        loadingContainer.classList.remove('active');
        userInfoContainer.classList.remove('active');
        notFound.classList.add('active');
        errorText.innerText = `${err?.message}`;
        errorBtn.style.display = "none";
    }
}

// Render extended forecast
function renderExtendedForecast(forecastData) {
    const forecastContainer = document.querySelector(".forecastContainer");
    forecastContainer.innerHTML = ""; // Clear previous data

    const dailyData = {};
    forecastData.forEach((entry) => {
        const date = entry.dt_txt.split(" ")[0]; 
        if (!dailyData[date]) {
            dailyData[date] = entry; 
        }
    });

    Object.keys(dailyData).forEach((date) => {
        const dayForecast = dailyData[date];
        const dayElement = document.createElement("div");
        dayElement.classList.add("forecastItem");

        dayElement.innerHTML = `
            <p class="forecast-date">${new Date(date).toDateString()}</p>
            <img src="http://openweathermap.org/img/w/${dayForecast.weather[0].icon}.png" alt="Weather icon">
            <p>${dayForecast.weather[0].description}</p>
            <p>${dayForecast.main.temp.toFixed(1)} °C</p>
        `;

        forecastContainer.appendChild(dayElement);
    });
}
