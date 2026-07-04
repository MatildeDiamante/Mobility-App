FROM node:22-bookworm-slim
LABEL mantainer="Matilde Moretti <matilde.moretti95@gmail.com>"

EXPOSE 4200

WORKDIR /app
COPY postmessagesweb /app
RUN npm install -g @angular/cli@19
RUN npm install
ENV NG_FORCE_TTY=0
CMD ["npm", "run", "--", "ng", "serve", "--host", "0.0.0.0", "--disable-host-check"]