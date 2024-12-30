let wakeLock = null;
let isSoundEnabled = false;
const SPEED_LIMIT = 40; // км/ч

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

function init() {
    if ("geolocation" in navigator) {
        navigator.geolocation.watchPosition(handlePosition, handleError, {
            enableHighAccuracy: true,
            timeout: 5000,
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
}

// Запуск приложения после загрузки DOM
document.addEventListener('DOMContentLoaded', init);

// Обработка событий видимости страницы для управления Wake Lock
document.addEventListener('visibilitychange', async () => {
    if (wakeLock !== null && document.visibilityState === 'visible') {
        await requestWakeLock();
    }
});



