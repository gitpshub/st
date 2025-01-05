let wakeLock = null;
let isSoundEnabled = true;
let SPEED_LIMIT = 55; 
let GEO_TIMEOUT = 5000; 
let watchId;

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

    if (isOverSpeedLimit && isSoundEnabled) {
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
  isSoundEnabled = !isSoundEnabled;
  const toggleButton = document.getElementById('toggleSound');
  if (toggleButton) {
    const icon = toggleButton.querySelector('i');
    if (icon) {
      icon.className = isSoundEnabled
        ? 'fas fa-volume-up'
        : 'fas fa-volume-mute';
    }
  }
  updateStatus(isSoundEnabled ? 'Звук включен' : 'Звук выключен');
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

  playSound.checked = isSoundEnabled;
}

function saveSettings(e) {
  e.preventDefault();
  SPEED_LIMIT = parseInt(speedLimit.value);
  GEO_TIMEOUT = parseInt(geoTimeout.value) * 1000;
  isSoundEnabled = playSound.checked;
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

  updateSettingsDisplay();
}

document.addEventListener('DOMContentLoaded', init);

document.addEventListener('visibilitychange', async () => {
  if (wakeLock !== null && document.visibilityState === 'visible') {
    await requestWakeLock();
  }
});
