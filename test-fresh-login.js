// Новый логин тест
const { execSync } = require('child_process');

console.log('=== НОВЫЙ ЛОГИН ===');

try {
    console.log('Делаем логин...');
    const result = execSync(`curl -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" -d "{\\"email\\":\\"admin@admin.com\\",\\"password\\":\\"admin\\"}" -c fresh-cookies.txt -v`, { encoding: 'utf8' });
    console.log('Логин успешен!');
    
    // Читаем cookies файл
    const fs = require('fs');
    if (fs.existsSync('fresh-cookies.txt')) {
        const cookieContent = fs.readFileSync('fresh-cookies.txt', 'utf8');
        console.log('\nCookies файл:');
        console.log(cookieContent);
        
        // Тестируем refresh с новыми cookies
        console.log('\n=== ТЕСТ REFRESH С НОВЫМИ COOKIES ===');
        const refreshResult = execSync('curl -X POST http://localhost:5000/api/auth/refresh -b fresh-cookies.txt -v', { encoding: 'utf8' });
        console.log('Refresh результат:');
        console.log(refreshResult);
    }
    
} catch (error) {
    console.log('Ошибка логина:');
    console.log(error.message);
}