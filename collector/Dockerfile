FROM node:18-slim

WORKDIR /app
COPY . .

ARG DATABASE_URL
ARG OPEN_API_KEY

ENV DATABASE_URL=$DATABASE_URL
ENV OPEN_API_KEY=$OPEN_API_KEY

RUN npm install
RUN npm run build

RUN apt-get update && apt-get install -y cron
COPY cronjob /etc/cron.d/scraper-cron
RUN chmod 0644 /etc/cron.d/scraper-cron && crontab /etc/cron.d/scraper-cron

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

CMD ["/entrypoint.sh"]

