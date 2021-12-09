FROM node:16-buster as builder

WORKDIR /app
COPY ./ ./
RUN npm ci && npm run build


FROM node:16-buster as packer
WORKDIR /app
COPY --from=builder /app/dist /app/package*.json ./
RUN npm ci --only=production


FROM gcr.io/distroless/nodejs:16
ENV NODE_ENV production
COPY --from=packer /app /app
CMD [ "/app/index.js" ]
