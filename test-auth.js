// Тест для проверки аутентификации
const { execSync } = require('child_process');

console.log('=== ТЕСТ АУТЕНТИФИКАЦИИ ===');

// Тест 1: Проверяем эндпоинт /me без токена
console.log('\n1. Проверяем /me без токена:');
try {
    const result = execSync('curl -X GET http://localhost:5000/api/auth/me -v', { encoding: 'utf8' });
    console.log('Ответ:', result.slice(0, 200) + '...');
} catch (error) {
    console.log('Ошибка (ожидаемо):', error.message.slice(0, 200));
}

// Тест 2: Проверяем логин
console.log('\n2. Тестируем логин:');
try {
    const loginData = JSON.stringify({
        email: 'admin@admin.com',
        password: 'admin'
    });
    
    const result = execSync(`curl -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" -d "${loginData}" -c cookies.txt -v`, { encoding: 'utf8' });
    console.log('Логин ответ:', result.slice(0, 300));
} catch (error) {
    console.log('Ошибка логина:', error.message.slice(0, 200));
}

// Тест 3: Проверяем /me с куками
console.log('\n3. Проверяем /me с куками:');
try {
    const result = execSync('curl -X GET http://localhost:5000/api/auth/me -b cookies.txt -v', { encoding: 'utf8' });
    console.log('Ответ с куками:', result.slice(0, 200));
} catch (error) {
    console.log('Ошибка с куками:', error.message.slice(0, 200));
}

console.log('\n=== КОНЕЦ ТЕСТА ===');