FROM node:20-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# VITE_API_BASE is baked in at build time (Vite has no runtime env access), so the
# BE's external address must be known before this image is built.
ARG VITE_API_BASE
ENV VITE_API_BASE=$VITE_API_BASE
RUN npm run build

FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
# React Router-less SPA still needs unknown paths (e.g. a refresh on /calendar)
# to fall back to index.html instead of nginx's default 404. $uri.html is tried
# first so extension-less static pages copied from public/ (e.g. /privacy ->
# privacy.html, required for the Google OAuth consent screen) resolve correctly
# instead of falling through to the SPA shell.
RUN printf 'server {\n\
    listen 80;\n\
    root /usr/share/nginx/html;\n\
    location / {\n\
        try_files $uri $uri.html /index.html;\n\
    }\n\
}\n' > /etc/nginx/conf.d/default.conf
EXPOSE 80
