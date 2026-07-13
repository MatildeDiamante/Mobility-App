FROM node:22-bookworm-slim
LABEL maintainer="Matilde Moretti <matilde.moretti95@gmail.com>"

EXPOSE 8080

WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .
CMD ["node", "server.js"]
