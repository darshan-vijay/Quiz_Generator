FROM node:18-slim

WORKDIR /app
COPY . .

RUN npm install
RUN npm run build

RUN apt-get update && apt-get install -y cron
COPY cronjob /etc/cron.d/scraper-cron
RUN chmod 0644 /etc/cron.d/scraper-cron && crontab /etc/cron.d/scraper-cron

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

CMD ["/entrypoint.sh"]

