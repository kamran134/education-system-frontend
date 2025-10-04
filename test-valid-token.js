// Создаем файл с валидным токеном из браузера
const fs = require('fs');

const browserToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2N2I1ZDg1NWQ0ODk2M2QxMGMxMTVhYzQiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NTk1NTMyMDQsImV4cCI6MTc2MDE1ODAwNH0.e-NUxoAo4CK39Zbpr2COLnlsVw51SNcUZUmdLNA0Tm0';

const cookieContent = `# Netscape HTTP Cookie File
localhost	FALSE	/	FALSE	1760158004	refreshToken	${browserToken}`;

fs.writeFileSync('valid-cookies.txt', cookieContent);

const { execSync } = require('child_process');

console.log('=== ТЕСТ С ВАЛИДНЫМ ТОКЕНОМ ===');

console.log('1. Тестируем refresh:');
try {
    const refreshResult = execSync('curl -X POST http://localhost:5000/api/auth/refresh -b valid-cookies.txt -v', { encoding: 'utf8' });
    console.log('✅ Refresh успешен!');
    console.log(refreshResult.match(/{"success.*?}$/m)?.[0] || 'No JSON response');
} catch (error) {
    console.log('❌ Ошибка refresh:');
    console.log(error.message.slice(-200));
}

console.log('\n2. Тестируем /me (должен требовать access token):');
try {
    const meResult = execSync('curl -X GET http://localhost:5000/api/auth/me -b valid-cookies.txt -v', { encoding: 'utf8' });
    console.log('Результат /me:');
    console.log(meResult.match(/{"success.*?}$/m)?.[0] || 'No JSON response');
} catch (error) {
    console.log('Ошибка /me (ожидаемо):');
    console.log(error.message.slice(-100));
}