let wakeLock = null;
let watchId;
let visibleDots = false;

let appSettings, IS_SOUND_ENABLED, SPEED_LIMIT, GEO_TIMEOUT;
const settingsKey = 'appSettings';

function loadSettingsFromLS() {
  const settings = localStorage.getItem(settingsKey);
  return settings
    ? JSON.parse(settings)
    : {
        IS_SOUND_ENABLED: true,
        SPEED_LIMIT: 55,
        GEO_TIMEOUT: 5000,
      };
}

function saveSettingsToLS(settings) {
  localStorage.setItem(settingsKey, JSON.stringify(settings));
}

const statusElement = document.getElementById('status');
const alarm = document.getElementById('alarmSound');

const modal = document.getElementById('settings-modal');

const speedLimit = document.getElementById('speedLimit');
const geoTimeout = document.getElementById('geoTimeout');
const playSound = document.getElementById('playSound');

const speedLimitValue = document.getElementById('speedLimitValue');
const geoTimeoutValue = document.getElementById('geoTimeoutValue');

async function requestWakeLock() {
  if ('wakeLock' in navigator) {
    try {
      wakeLock = await navigator.wakeLock.request('screen');
      updateStatus('Блокировка экрана активирована');
    } catch (err) {
      updateStatus('Ошибка активации блокировки экрана: ' + err);
    }
  } else {
    updateStatus('Wake Lock API не поддерживается');
  }
}

function updateSpeed(speed) {
  const speedElement = document.getElementById('speed');
  if (speedElement) {
    const roundedSpeed = Math.round(speed);
    speedElement.textContent = `${roundedSpeed} км/ч`;

    const isOverSpeedLimit = roundedSpeed >= SPEED_LIMIT;
    document.body.style.backgroundColor = isOverSpeedLimit ? 'red' : 'green';

    if (isOverSpeedLimit && IS_SOUND_ENABLED) {
      playAlarm();
    } else {
      stopAlarm();
    }
  }
}

function updateStatus(message) {
  statusElement.textContent = message;
}

function handlePosition(position) {
  const speed = position.coords.speed;

  if (speed !== null) {
    const speedKMH = speed * 3.6;
    updateSpeed(speedKMH);
  } else {
    updateStatus('Данные о скорости недоступны');
  }
}

function handleError(error) {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      updateStatus('Пользователь отказал в доступе к геолокации.');
      break;
    case error.POSITION_UNAVAILABLE:
      updateStatus('Информация о местоположении недоступна.');
      break;
    case error.TIMEOUT:
      updateStatus(
        'Истекло время ожидания запроса на определение местоположения.'
      );
      break;
    case error.UNKNOWN_ERROR:
      updateStatus('Произошла неизвестная ошибка.');
      break;
  }
}

function playAlarm() {
  alarm.play().catch((e) => console.error('Ошибка воспроизведения звука:', e));
}

function stopAlarm() {
  alarm.pause();
  alarm.currentTime = 0;
}

function toggleSound() {
  IS_SOUND_ENABLED = !IS_SOUND_ENABLED;
  const toggleButton = document.getElementById('toggleSound');
  if (toggleButton) {
    const icon = toggleButton.querySelector('i');
    if (icon) {
      icon.className = IS_SOUND_ENABLED
        ? 'fas fa-volume-up'
        : 'fas fa-volume-mute';
    }
  }
  updateStatus(IS_SOUND_ENABLED ? 'Звук включен' : 'Звук выключен');
}

function openSettings() {
  modal.style.display = 'block';
  updateSettingsDisplay();
}

function closeSettings() {
  modal.style.display = 'none';
}

function updateSettingsDisplay() {
  speedLimitValue.textContent = SPEED_LIMIT + ' км/ч';
  geoTimeoutValue.textContent = GEO_TIMEOUT / 1000 + ' сек';

  speedLimit.value = SPEED_LIMIT;
  speedLimit.style.setProperty('--value', speedLimit.value / speedLimit.max);

  geoTimeout.value = GEO_TIMEOUT / 1000;
  geoTimeout.style.setProperty(
    '--value',
    (geoTimeout.value - geoTimeout.min) / (geoTimeout.max - geoTimeout.min)
  );

  playSound.checked = IS_SOUND_ENABLED;
}

function saveSettings(e) {
  e.preventDefault();
  SPEED_LIMIT = parseInt(speedLimit.value);
  GEO_TIMEOUT = parseInt(geoTimeout.value) * 1000;
  IS_SOUND_ENABLED = playSound.checked;

  appSettings = {
    IS_SOUND_ENABLED,
    SPEED_LIMIT,
    GEO_TIMEOUT,
  };
  saveSettingsToLS(appSettings);

  updateSettingsDisplay();
  closeSettings();
  restartGeolocation();
}

function restartGeolocation() {
  if ('geolocation' in navigator) {
    navigator.geolocation.clearWatch(watchId);
    watchId = navigator.geolocation.watchPosition(handlePosition, handleError, {
      enableHighAccuracy: true,
      timeout: GEO_TIMEOUT,
      maximumAge: 0,
    });
  }
}

function init() {
  if ('geolocation' in navigator) {
    watchId = navigator.geolocation.watchPosition(handlePosition, handleError, {
      enableHighAccuracy: true,
      timeout: GEO_TIMEOUT,
      maximumAge: 0,
    });
    requestWakeLock();
  } else {
    updateStatus('Геолокация не поддерживается вашим браузером.');
  }

  const toggleButton = document.getElementById('toggleSound');
  if (toggleButton) {
    toggleButton.addEventListener('click', toggleSound);
  }

  const openSettingsButton = document.getElementById('openSettings');
  if (openSettingsButton) {
    openSettingsButton.addEventListener('click', openSettings);
  }

  const closeSettingsButton = document.getElementById('closeSettings');
  if (closeSettingsButton) {
    closeSettingsButton.addEventListener('click', closeSettings);
  }

  const settingsForm = document.getElementById('settings-form');
  if (settingsForm) {
    settingsForm.addEventListener('submit', saveSettings);
  }

  speedLimit.addEventListener('input', function () {
    speedLimitValue.textContent = parseInt(this.value) + ' км/ч';
    this.style.setProperty('--value', this.value / this.max);
  });

  geoTimeout.addEventListener('input', function () {
    geoTimeoutValue.textContent = parseInt(this.value) + ' сек';
    this.style.setProperty(
      '--value',
      (this.value - this.min) / (this.max - this.min)
    );
  });

  appSettings = loadSettingsFromLS();
  IS_SOUND_ENABLED = !appSettings.IS_SOUND_ENABLED;
  toggleSound();
  SPEED_LIMIT = appSettings.SPEED_LIMIT;
  GEO_TIMEOUT = appSettings.GEO_TIMEOUT;

  updateClock();
  setInterval(() => {
    updateClock();
  }, 500);

  updateSettingsDisplay();
}

document.addEventListener('DOMContentLoaded', init);

document.body.addEventListener('click', () => {
    if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen();
    }  
});

document.addEventListener('visibilitychange', async () => {
  if (wakeLock !== null && document.visibilityState === 'visible') {
    await requestWakeLock();
  }
});

const updateClock = () => {
  visibleDots = !visibleDots;
  const date = new Date();

  const day = date.getDate();

  const months = [
    "января", "февраля", "марта", "апреля", "мая", "июня",
    "июля", "августа", "сентября", "октября", "ноября", "декабря"
  ];
  const month = months[date.getMonth()];

  const weekdays = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
  const weekday = weekdays[date.getDay()];

  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  const dayText = document.getElementById('day');
  const weekdayText = document.getElementById('weekDay');
  const hourText = document.getElementById('hour');
  const minText = document.getElementById('min');
  const dbDots = document.getElementById('dbDots');
  
  dayText.textContent = `${day} ${month}`;
  weekdayText.textContent = weekday;
  hourText.textContent = hours;
  minText.textContent = minutes;
  dbDots.className = visibleDots ? 'tic':'tac';
}

const apiKey = '33aa5dc1c6d67229729f933e56c4b4e5';
const city = 'Maykop';

  async function getWeather() {
  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric&lang=ru`
    );
    if (!response.ok) throw new Error('Ошибка запроса погоды');
    const data = await response.json();

    document.getElementById('temp').textContent = `${Math.round(data.main.temp)}°C`;
    const iconCode = data.weather[0].icon;
    document.getElementById('icon').innerHTML = `<img src="https://openweathermap.org/img/wn/${iconCode}@2x.png" alt="Иконка погоды">`;
  } catch (error) {
    console.error(error);
    document.getElementById('weather-widget').textContent = 'Не удалось загрузить погоду';
  }
}

getWeather();