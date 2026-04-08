FROM node:18

WORKDIR /app

COPY . .

RUN if [ -f package.json ]; then \
      npm install; \
    else \
      npm init -y && npm install express mysql2; \
    fi

EXPOSE 8080

CMD ["node", "server.js"]