FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG NUXT_PUBLIC_API_URL=http://localhost:4000/graphql
ENV NUXT_PUBLIC_API_URL=$NUXT_PUBLIC_API_URL
RUN npm run build

FROM node:20-alpine AS development
WORKDIR /app
COPY package*.json ./
RUN npm ci
EXPOSE 3000
CMD ["npm", "run", "dev"]

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nuxtuser
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/.output ./.output
USER nuxtuser
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
