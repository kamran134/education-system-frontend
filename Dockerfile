# Используем Node.js для сборки Angular-приложения
FROM node:22 AS build

WORKDIR /app

# Копируем package.json
COPY package.json package-lock.json ./

# Устанавливаем зависимости
#RUN npm install && npm install -g @angular/cli
# Устанавливаем зависимости и кешируем их
RUN npm ci && npm install -g @angular/cli

# Копируем весь проект
COPY . .

# Собираем проект
RUN ng build --configuration=production

# Используем Nginx
FROM nginx:alpine

# Копируем файлы Angular в Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/education-system-frontend/browser /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
