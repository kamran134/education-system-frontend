// Тест с новым токеном из браузера
const fs = require('fs');
const { execSync } = require('child_process');

const newBrowserToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2N2I1ZDg1NWQ0ODk2M2QxMGMxMTVhYzQiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NTk1NTQyOTYsImV4cCI6MTc2MDE1OTA5Nn0.AbYQS1zgLCdrvjSvBJ5zqqDJPzEvLxgI5SrFwy44NA8';

const cookieContent = `# Netscape HTTP Cookie File
localhost	FALSE	/	FALSE	1760158482	refreshToken	${newBrowserToken}`;

fs.writeFileSync('fresh-cookies.txt', cookieContent);

console.log('=== ТЕСТ С НОВЫМ ТОКЕНОМ ===');

console.log('1. Тестируем refresh с новым токеном:');
try {
    const refreshResult = execSync('curl -X POST http://localhost:5000/api/auth/refresh -b fresh-cookies.txt -c updated-cookies.txt -s', { encoding: 'utf8' });
    console.log('Refresh ответ:', refreshResult);
    
    const refreshData = JSON.parse(refreshResult);
    if (refreshData.success && refreshData.data && refreshData.data.token) {
        console.log('✅ REFRESH РАБОТАЕТ!');
        const accessToken = refreshData.data.token;
        console.log('Access token получен:', accessToken.substring(0, 50) + '...');
        
        // Тестируем /me с access токеном
        console.log('\n2. Тестируем /me с access токеном:');
        const meResult = execSync(`curl -X GET http://localhost:5000/api/auth/me -H "Authorization: Bearer ${accessToken}" -s`, { encoding: 'utf8' });
        console.log('/me ответ:', meResult);
        
        const meData = JSON.parse(meResult);
        if (meData.success) {
            console.log('\n🎉🎉🎉 АУТЕНТИФИКАЦИЯ ПОЛНОСТЬЮ РАБОТАЕТ! 🎉🎉🎉');
            console.log('Пользователь:', meData.data.user.email, '(' + meData.data.user.role + ')');
        } else {
            console.log('❌ /me не работает:', meData.message);
        }
    } else {
        console.log('❌ Refresh не вернул access токен');
        console.log('Полный ответ:', refreshResult);
    }
} catch (error) {
    console.log('❌ Ошибка:', error.message);
}

console.log('\n=== КОНЕЦ ТЕСТА ===');