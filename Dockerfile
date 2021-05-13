FROM node:14

ENV JWT_SECRET=#JWT_SECRET
ENV DB_PATH=#DB_PATH
ENV SENDGRID_API_KEY=#SENDGRID_API_KEY

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

CMD ["node", "src/index.js"]