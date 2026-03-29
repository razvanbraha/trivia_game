FROM node:18

WORKDIR /app

# copy package files
COPY app/backend/package*.json ./
RUN npm install && npm install -g nodemon

# copy real protocol.json from shared
COPY shared/protocol.json ./protocol.json

# copy rest of backend source
COPY app/backend .

EXPOSE 8080

CMD ["nodemon", "server.js"]