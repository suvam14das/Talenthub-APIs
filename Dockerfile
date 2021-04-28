FROM node:14

ENV JWT_SECRET=#JWT_SECRET
ENV DB_PATH=#DB_PATH
ENV SENDGRID_API_KEY=#SENDGRID_API_KEY

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm install
# If you are building your code for production
# RUN npm ci --only=production

# Bundle app source
COPY . .

CMD ["node", "src/index.js"]