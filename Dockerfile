FROM nginx:alpine

MAINTAINER Samuel Gratzl <samuel.gratzl@datavisyn.io>

COPY ./build /usr/share/nginx/html
