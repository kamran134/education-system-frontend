// Тест для проверки refresh токена из браузера
const { execSync } = require('child_process');

console.log('=== ТЕСТ REFRESH ТОКЕНА ===');

// Создаем файл с cookie из браузера
const cookieContent = `# Netscape HTTP Cookie File
localhost	FALSE	/	FALSE	1760157639	refreshToken	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2N2I1ZDg1NWQ0ODk2M2QxMGMxMTVhYzQiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NTk1NTI4MzksImV4cCI6MTc2MDE1NzYzOX0.wG6Fco20q98BsXsZ3r_a8mOLLstu2t4B9TYUyJvLOBc`;

require('fs').writeFileSync('browser-cookies.txt', cookieContent);

console.log('\n1. Проверяем /me с токеном из браузера:');
try {
    const result = execSync('curl -X GET http://localhost:5000/api/auth/me -b browser-cookies.txt -v', { encoding: 'utf8' });
    console.log('Ответ:', result);
} catch (error) {
    console.log('Ошибка:', error.message);
}

console.log('\n2. Пробуем refresh токен:');
try {
    const result = execSync('curl -X POST http://localhost:5000/api/auth/refresh -b browser-cookies.txt -v', { encoding: 'utf8' });
    console.log('Refresh ответ:', result);
} catch (error) {
    console.log('Refresh ошибка:', error.message);
}

console.log('\n=== КОНЕЦ ТЕСТА ===');