FROM node:18

WORKDIR /app

# copy package files
COPY app/backend/package*.json ./
RUN npm install && npm install -g nodemon

# copy rest of backend source
COPY app/backend .

# copy real WebSocket protocol helper from shared
COPY shared/ws-api.js ./ws-api.js

# copy frontend assets served by the backend at /public
COPY app/frontend /frontend

RUN if [ -f package.json ]; then \
      npm install; \
    else \
      npm init -y && npm install express mariadb; \
    fi

EXPOSE 8080

CMD ["nodemon", "server.js"]
