
Commands to run post deployment:

docker build -t wiki-scraper .
docker rm -f my-scraper
docker run -d --name my-scraper wiki-scraper

