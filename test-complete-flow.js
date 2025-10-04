// Полный тест: логин -> refresh -> /me
const { execSync } = require('child_process');
const fs = require('fs');

console.log('=== ПОЛНЫЙ ТЕСТ АУТЕНТИФИКАЦИИ ===');

try {
    // 1. Логин
    console.log('1. Делаем логин...');
    const loginResult = execSync(`curl -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" -d "{\\"email\\":\\"admin@admin.com\\",\\"password\\":\\"testadmin\\"}" -c test-cookies.txt -s`, { encoding: 'utf8' });
    
    console.log('Логин ответ:', loginResult);
    
    // 2. Проверяем cookies
    if (fs.existsSync('test-cookies.txt')) {
        const cookies = fs.readFileSync('test-cookies.txt', 'utf8');
        console.log('\n2. Cookies файл:');
        console.log(cookies);
        
        if (cookies.includes('refreshToken')) {
            // 3. Тестируем refresh
            console.log('\n3. Тестируем refresh...');
            const refreshResult = execSync('curl -X POST http://localhost:5000/api/auth/refresh -b test-cookies.txt -c updated-cookies.txt -s', { encoding: 'utf8' });
            console.log('Refresh ответ:', refreshResult);
            
            const refreshData = JSON.parse(refreshResult);
            if (refreshData.success && refreshData.data.token) {
                // 4. Тестируем /me с access токеном
                console.log('\n4. Тестируем /me с access токеном...');
                const accessToken = refreshData.data.token;
                const meResult = execSync(`curl -X GET http://localhost:5000/api/auth/me -H "Authorization: Bearer ${accessToken}" -s`, { encoding: 'utf8' });
                console.log('/me ответ:', meResult);
                
                console.log('\n🎉 АУТЕНТИФИКАЦИЯ РАБОТАЕТ!');
            } else {
                console.log('❌ Refresh не вернул токен');
            }
        } else {
            console.log('❌ Refresh токен не установлен в cookies');
        }
    } else {
        console.log('❌ Cookies файл не создан');
    }
    
} catch (error) {
    console.log('❌ Ошибка:', error.message);
}

console.log('\n=== КОНЕЦ ТЕСТА ===');