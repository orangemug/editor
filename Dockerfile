FROM node:8

EXPOSE 8888

# RUN npm install -d --dev
# RUN npm run build

CMD npm run start -- --host 0.0.0.0
