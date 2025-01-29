FROM node:18 AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install install --omit=dev

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist/education-system-front /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]