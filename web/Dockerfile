FROM node:14

RUN mkdir -p /var/www/app

WORKDIR /var/www/app

RUN wget https://github.com/jwilder/dockerize/releases/download/v0.6.1/dockerize-linux-amd64-v0.6.1.tar.gz \
    && tar -C /usr/local/bin -xzvf dockerize-linux-amd64-v0.6.1.tar.gz \
    && rm dockerize-linux-amd64-v0.6.1.tar.gz
    
RUN apt-get update && apt-get install -y dnsutils && apt-get install -y vim-common

COPY . .

RUN npm install

EXPOSE 3000

CMD [ "node", "app.js" ]

