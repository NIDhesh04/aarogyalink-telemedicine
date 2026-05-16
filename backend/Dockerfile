FROM node:20-slim

WORKDIR /app

COPY package*.json ./

RUN npm install --omit=dev

COPY . .

# Ensure the prescriptions output directory exists
RUN mkdir -p public/prescriptions

EXPOSE 5005

CMD ["node", "src/server.js"]
