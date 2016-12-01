FROM node:6

# add project to build
ADD . /root/pivot
WORKDIR /root/pivot

RUN npm install && \
    npm -g install gulp-cli && \
    npm install --dev && \
    gulp

VOLUME /root/config

EXPOSE 9090
CMD ["node","build/server/www.js"]
