FROM node:16

WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm install

# Bundle app source
COPY . .

ENV CLIENT_URL ""
ENV SENTRY_DSN ""
ENV SENTRY_ENVIRONMENT ""
ENV SENDGRID_API_KEY ""
ENV SENDGRID_EMAIL ""
ENV SERVER_SECRET ""
ENV DATABASE_URL ""
ENV GOOGLE_CLIENT_ID ""
ENV PORT 4000

EXPOSE 8081

CMD ["npm", "start"]