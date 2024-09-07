FROM nginx:alpine
ADD ./nginx/default.conf /etc/nginx/conf.d/default.conf
ADD ./nginx/ssl/fullchain.pem /etc/nginx/ssl/fullchain.pem
ADD ./nginx/ssl/privkey.pem /etc/nginx/ssl/privkey.pem
ADD ./data/ /var/www/html/