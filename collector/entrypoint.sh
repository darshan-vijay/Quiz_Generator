#!/bin/sh

# echo "Cleaning queue with GPT..."
# /usr/local/bin/node /app/dist/cleanQueue.js >> /app/output.log 2>&1

echo "Running scraper immediately..."
/usr/local/bin/node /app/dist/scraper.js >> /app/output.log 2>&1

echo "Starting cron..."
cron -f
