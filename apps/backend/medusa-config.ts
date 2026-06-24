import { loadEnv, defineConfig } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

const isProduction = process.env.NODE_ENV === "production"

function requireEnv(key: string, fallback?: string): string {
  const value = process.env[key]
  if (!value && isProduction) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
  return value ?? fallback ?? "dev-only"
}

module.exports = defineConfig({
  plugins: [
    {
      resolve: "@craiahq/medusa-plugin-base",
      options: {},
    },
  ],
  projectConfig: {
    databaseUrl: requireEnv("DATABASE_URL"),
    redisUrl: requireEnv("REDIS_URL"),
    http: {
      storeCors: requireEnv("STORE_CORS"),
      adminCors: requireEnv("ADMIN_CORS"),
      authCors: requireEnv("AUTH_CORS"),
      jwtSecret: requireEnv("JWT_SECRET", "supersecret-dev-only"),
      cookieSecret: requireEnv("COOKIE_SECRET", "supersecret-dev-only"),
    }
  },
  modules: [
    { resolve: "./src/modules/brand" },
    {
      resolve: "@medusajs/medusa/event-bus-redis",
      options: { redisUrl: process.env.REDIS_URL },
    },
    {
      resolve: "@medusajs/medusa/cache-redis",
      options: { redisUrl: process.env.REDIS_URL },
    },
    {
      resolve: "@medusajs/medusa/payment",
      options: {
        providers: [
          {
            // Local override of the plugin's ONVO provider — fixes the webhook
            // capture flow (see src/modules/onvo-pay/service.ts). Keeps id
            // "onvo-pay" so the provider id stays pp_onvo-pay_onvo-pay.
            resolve: "./src/modules/onvo-pay",
            id: "onvo-pay",
            options: {
              secretKey: requireEnv("ONVO_SECRET_KEY"),
              webhookSecret: requireEnv("ONVO_WEBHOOK_SECRET"),
              captureMethod: "automatic",
              allowedReturnUrlHosts: [
                process.env.STOREFRONT_HOST ?? "localhost",
              ],
            },
          },
        ],
      },
    },
  ],
  admin: {
    vite: () => ({
      server: {
        host: "0.0.0.0",
        allowedHosts: ["localhost", ".localhost", "127.0.0.1"],
        hmr: { port: 5173, clientPort: 5174 },
      },
    }),
  },
})
