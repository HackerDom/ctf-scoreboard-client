FROM node:12

COPY ./scoreboard /scoreboard
WORKDIR /scoreboard

RUN npm install
RUN npm run build
