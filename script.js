let lastPosition = null;
let lastTimestamp = null;
let wakeLock = null;

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
    const roundedSpeed = Math.round(speed);
    speedElement.textContent = `${roundedSpeed} км/ч`;

    document.body.style.backgroundColor = roundedSpeed < 53 ? 'green' : 'red';
}

function updateStatus(message) {
    const statusElement = document.getElementById('status');
    statusElement.textContent = message;
}

function calculateSpeed(position) {
    const currentPosition = position.coords;
    const currentTimestamp = position.timestamp;

    if (lastPosition && lastTimestamp) {
        const distance = calculateDistance(lastPosition, currentPosition);
        const timeElapsed = (currentTimestamp - lastTimestamp) / 1000; // в секундах
        const speedMPS = distance / timeElapsed;
        const speedKMH = speedMPS * 3.6; // конвертация в км/ч

        updateSpeed(speedKMH);
    }

    lastPosition = currentPosition;
    lastTimestamp = currentTimestamp;
}

function calculateDistance(pos1, pos2) {
    const R = 6371e3; // радиус Земли в метрах
    const φ1 = pos1.latitude * Math.PI / 180;
    const φ2 = pos2.latitude * Math.PI / 180;
    const Δφ = (pos2.latitude - pos1.latitude) * Math.PI / 180;
    const Δλ = (pos2.longitude - pos1.longitude) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // в метрах
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

function init() {
    if ("geolocation" in navigator) {
        navigator.geolocation.watchPosition(calculateSpeed, handleError, {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
        });
        requestWakeLock();
    } else {
        updateStatus("Геолокация не поддерживается вашим браузером.");
    }
}

// Запуск приложения
init();

// Обработка событий видимости страницы для управления Wake Lock
document.addEventListener('visibilitychange', async () => {
    if (wakeLock !== null && document.visibilityState === 'visible') {
        await requestWakeLock();
    }
});

