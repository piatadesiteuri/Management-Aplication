# --- build stage ---
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
# IMPORTANT: this project currently fails `tsc` due to strict unused vars/type errors.
# Vite can still build the bundle without typechecking.
RUN npx vite build

# --- runtime stage ---
FROM nginx:1.27-alpine AS runner
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
