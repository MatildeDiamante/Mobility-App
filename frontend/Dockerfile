FROM node:22-bookworm-slim
LABEL maintainer="Matilde Moretti <matilde.moretti95@gmail.com>"

EXPOSE 4200

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
CMD ["npm", "start"]
