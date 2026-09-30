# --- 1) Compilación ---
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi
COPY . .

# Easypanel pasa las variables de entorno del servicio como build args.
# Las VITE_ se incrustan en la web al compilar.
ARG VITE_NEXURA_WEBHOOK_URL=""
ARG VITE_NEXURA_AUDIO_FIELD="data"
ARG VITE_CONTACT_FORM_ENDPOINT=""
ARG VITE_CALENDLY_URL=""
ARG VITE_GITHUB_URL=""
ARG VITE_LABS_URL=""
ENV VITE_NEXURA_WEBHOOK_URL=$VITE_NEXURA_WEBHOOK_URL \
    VITE_NEXURA_AUDIO_FIELD=$VITE_NEXURA_AUDIO_FIELD \
    VITE_CONTACT_FORM_ENDPOINT=$VITE_CONTACT_FORM_ENDPOINT \
    VITE_CALENDLY_URL=$VITE_CALENDLY_URL \
    VITE_GITHUB_URL=$VITE_GITHUB_URL \
    VITE_LABS_URL=$VITE_LABS_URL
RUN npm run build

# --- 2) Servidor web ---
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
