FROM node:20-alpine

WORKDIR /app

COPY index.html app.js style.css server.js ./

EXPOSE 8080

CMD ["node", "server.js"]