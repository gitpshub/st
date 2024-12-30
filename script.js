let wakeLock = null;
let isSoundEnabled = true;
let SPEED_LIMIT = 40; // км/ч
let GEO_TIMEOUT = 5000; // 5 секунд
let watchId;

async function requestWakeLock() {
    if ('wakeLock' in navigator) {
        try {
            wakeLock = await navigator.wakeLock.request('screen');
            updateStatus('Wake Lock активирован');
        } catch (err) {
            updateStatus('Ошибка активации Wake Lock: ' + err);
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
    const statusElement = document.getElementById('status');
    if (statusElement) {
        statusElement.textContent = message;
    }
}

function handlePosition(position) {
    const speed = position.coords.speed;
    
    if (speed !== null) {
        // Преобразуем скорость из м/с в км/ч
        const speedKMH = speed * 3.6;
        updateSpeed(speedKMH);
    } else {
        updateStatus("Данные о скорости недоступны");
    }
}

function handleError(error) {
    switch(error.code) {
        case error.PERMISSION_DENIED:
            updateStatus("Пользователь отказал в доступе к геолокации.");
            break;
        case error.POSITION_UNAVAILABLE:
            updateStatus("Информация о местоположении недоступна.");
            break;
        case error.TIMEOUT:
            updateStatus("Истекло время ожидания запроса на определение местоположения.");
            break;
        case error.UNKNOWN_ERROR:
            updateStatus("Произошла неизвестная ошибка.");
            break;
    }
}

function playAlarm() {
    const alarm = document.getElementById('alarmSound');
    if (alarm) {
        alarm.play().catch(e => console.error("Ошибка воспроизведения звука:", e));
    }
}

function stopAlarm() {
    const alarm = document.getElementById('alarmSound');
    if (alarm) {
        alarm.pause();
        alarm.currentTime = 0;
    }
}

function toggleSound() {
    isSoundEnabled = !isSoundEnabled;
    const toggleButton = document.getElementById('toggleSound');
    if (toggleButton) {
        const icon = toggleButton.querySelector('i');
        if (icon) {
            icon.className = isSoundEnabled ? 'fas fa-volume-up' : 'fas fa-volume-mute';
        }
    }
    updateStatus(isSoundEnabled ? 'Звук включен' : 'Звук выключен');
}

function openSettings() {
    const modal = document.getElementById('settings-modal');
    if (modal) {
        modal.style.display = 'block';
    }
}

function closeSettings() {
    const modal = document.getElementById('settings-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function updateSettingsDisplay() {
    document.getElementById('speedLimitValue').textContent = SPEED_LIMIT;
    document.getElementById('geoTimeoutValue').textContent = GEO_TIMEOUT / 1000;
    document.getElementById('playSound').checked = isSoundEnabled;
}

function saveSettings(e) {
    e.preventDefault();
    SPEED_LIMIT = parseInt(document.getElementById('speedLimit').value);
    GEO_TIMEOUT = parseInt(document.getElementById('geoTimeout').value) * 1000;
    isSoundEnabled = document.getElementById('playSound').checked;
    updateSettingsDisplay();
    closeSettings();
    restartGeolocation();
}

function restartGeolocation() {
    if ("geolocation" in navigator) {
        navigator.geolocation.clearWatch(watchId);
        watchId = navigator.geolocation.watchPosition(handlePosition, handleError, {
            enableHighAccuracy: true,
            timeout: GEO_TIMEOUT,
            maximumAge: 0
        });
    }
}

function init() {
    if ("geolocation" in navigator) {
        watchId = navigator.geolocation.watchPosition(handlePosition, handleError, {
            enableHighAccuracy: true,
            timeout: GEO_TIMEOUT,
            maximumAge: 0
        });
        requestWakeLock();
    } else {
        updateStatus("Геолокация не поддерживается вашим браузером.");
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

    updateSettingsDisplay();
}

// Запуск приложения после загрузки DOM
document.addEventListener('DOMContentLoaded', init);

// Обработка событий видимости страницы для управления Wake Lock
document.addEventListener('visibilitychange', async () => {
    if (wakeLock !== null && document.visibilityState === 'visible') {
        await requestWakeLock();
    }
});

