import { loadEnv, defineConfig } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

module.exports = defineConfig({
  admin: {
    disable: process.env.DISABLE_MEDUSA_ADMIN === "true",
  },

  projectConfig: {
    workerMode: process.env.MEDUSA_WORKER_MODE as "shared" | "worker" | "server",
    databaseUrl: process.env.DATABASE_URL,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET,
      cookieSecret: process.env.COOKIE_SECRET,
    }

    
  },
  modules: [
    {
      resolve: "./src/modules/brand",
    },
    {
  resolve: "@medusajs/medusa/locking",
  options: {
    providers: [
      {
        resolve: "@medusajs/medusa/locking-redis",
        id: "locking-redis",
        is_default: true,
        options: {
          redisUrl: process.env.REDIS_URL,
        },
      },
    ],
  },
},
{
   resolve: "@medusajs/medusa/event-bus-redis",
      options: { 
        redisUrl: process.env.EVENTS_REDIS_URL,
        // suggested additional options for production use
        jobOptions: {
          removeOnComplete: {
            // keep jobs for 1 hour or up to 1000 jobs
            age: 3600,
            count: 1000,
          },
          removeOnFail: {
            // keep jobs for 1 hour or up to 1000 jobs
            age: 3600,
            count: 1000,
          },
        },
      },
    },

{
  resolve: "./src/modules/delivery-slot",
},
  ],
})
