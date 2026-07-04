FROM node:22-bookworm-slim
LABEL mantainer="Matilde Moretti <matilde.moretti95@gmail.com>"

EXPOSE 8080

WORKDIR /app
COPY . /app
RUN npm install

RUN npm run compile
CMD ["node"]