import { randomUUID } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'

import { addServerHandler, defineNuxtModule, addPlugin, createResolver, addRouteMiddleware, addImports, addComponent, addTemplate, addTypeTemplate } from '@nuxt/kit'
import { defu } from 'defu'
import type { CookieSerializeOptions } from 'cookie-es'
import { join } from 'pathe'

import { version } from '../package.json'

// Module options TypeScript interface definition
export interface ModuleOptions {
  password: string
  cookie: Partial<CookieSerializeOptions>
  middleware?: boolean
  endpoints?: {
    callback: string
    login: string
    logout: string
    register: string
    health: string
    access: string
  }
  handlers?: {
    callback?: string
    login?: string
    logout?: string
    register?: string
    health?: string
    access?: string
  }
  authDomain?: string
  clientId?: string
  clientSecret?: string
  redirectURL?: string
  logoutRedirectURL?: string
  postLoginRedirectURL?: string
  audience?: string
  debug?: boolean
}

const resolver = createResolver(import.meta.url)
export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: '@nuxtjs/kinde',
    configKey: 'kinde',
    version,
  },
  // Default configuration options of the Nuxt module
  defaults: nuxt => ({
    password: process.env.NUXT_KINDE_PASSWORD || '',
    cookie: {
      sameSite: 'lax',
      secure: !nuxt.options.dev,
      httpOnly: true,
    },
    endpoints: {
      callback: '/api/callback',
      login: '/api/login',
      register: '/api/register',
      health: '/api/health',
      logout: '/api/logout',
      access: '/api/access',
    },
    middleware: true,
    authDomain: '',
    clientId: '',
    clientSecret: '',
    redirectURL: '',
    logoutRedirectURL: '',
    postLoginRedirectURL: '',
    audience: '',
    debug: nuxt.options.dev || nuxt.options.debug,
  }),
  async setup(options, nuxt) {
    console.log('📦 Module Setup - Initial Options:', {
      hasAuthDomain: !!options.authDomain,
      hasClientId: !!options.clientId,
      envAuthDomain: process.env.NUXT_KINDE_AUTH_DOMAIN,
      envClientId: process.env.NUXT_KINDE_CLIENT_ID
    });

    // Ensure environment variables are properly loaded
    const envConfig = {
      authDomain: process.env.NUXT_KINDE_AUTH_DOMAIN || options.authDomain,
      clientId: process.env.NUXT_KINDE_CLIENT_ID || options.clientId,
      clientSecret: process.env.NUXT_KINDE_CLIENT_SECRET || options.clientSecret,
      redirectURL: process.env.NUXT_KINDE_REDIRECT_URL || options.redirectURL,
      logoutRedirectURL: process.env.NUXT_KINDE_LOGOUT_REDIRECT_URL || options.logoutRedirectURL,
      postLoginRedirectURL: process.env.NUXT_KINDE_POST_LOGIN_REDIRECT_URL || options.postLoginRedirectURL,
      audience: process.env.NUXT_KINDE_AUDIENCE || options.audience,
    }

    // Set runtime config
    nuxt.options.runtimeConfig = defu(nuxt.options.runtimeConfig, {
      public: {
        kinde: {
          authDomain: envConfig.authDomain,
          clientId: envConfig.clientId,
          redirectURL: envConfig.redirectURL,
          logoutRedirectURL: envConfig.logoutRedirectURL,
          postLoginRedirectURL: envConfig.postLoginRedirectURL,
          audience: envConfig.audience,
        }
      },
      kinde: {
        password: options.password || process.env.NUXT_KINDE_PASSWORD,
        cookie: {
          sameSite: String(options.cookie?.sameSite || 'lax'),
          secure: Boolean(options.cookie?.secure),
          httpOnly: Boolean(options.cookie?.httpOnly),
        },
        clientSecret: envConfig.clientSecret,
      }
    })

    console.log('📦 Module Setup - Public Config:', {
      authDomain: nuxt.options.runtimeConfig.public.kinde.authDomain,
      clientId: nuxt.options.runtimeConfig.public.kinde.clientId,
      redirectURL: nuxt.options.runtimeConfig.public.kinde.redirectURL
    });

    console.log('📦 Module Setup - Private Config:', {
      hasPassword: !!nuxt.options.runtimeConfig.kinde.password,
      hasClientSecret: !!nuxt.options.runtimeConfig.kinde.clientSecret,
      cookieSettings: nuxt.options.runtimeConfig.kinde.cookie
    });

    addTemplate({
      filename: 'kinde-routes.config.mjs',
      getContents: () => `export default ${JSON.stringify(options.endpoints)}`,
    })

    // https://github.com/Atinux/nuxt-auth-utils/blob/main/src/module.ts#L71-L80
    if (nuxt.options.dev && !nuxt.options.runtimeConfig.kinde.password) {
      nuxt.options.runtimeConfig.kinde.password = randomUUID().replace(/-/g, '')
      // Add it to .env
      const envPath = join(nuxt.options.rootDir, '.env')
      const envContent = await readFile(envPath, 'utf-8').catch(() => '')
      if (!envContent.includes('NUXT_KINDE_PASSWORD')) {
        await writeFile(envPath, `${envContent ? envContent + '\n' : envContent}NUXT_KINDE_PASSWORD=${nuxt.options.runtimeConfig.kinde.password}`, 'utf-8')
      }
    }

    nuxt.options.nitro.virtual ||= {}
    nuxt.options.nitro.virtual['kinde-version.mjs'] = () => `export const version = '${version}'`

    // Do not add the extension since the `.ts` will be transpiled to `.mjs` after `npm run prepack`
    addPlugin(resolver.resolve('./runtime/plugin'))

    // Server endpoints
    addServerHandler({
      middleware: true,
      handler: resolver.resolve('./runtime/server/middleware/kinde'),
    })

    addServerHandler({
      route: options.endpoints!.callback!,
      handler:
        options.handlers?.callback
        || resolver.resolve('./runtime/server/api/callback.get'),
    })
    addServerHandler({
      route: options.endpoints!.login!,
      handler:
        options.handlers?.login
        || resolver.resolve('./runtime/server/api/login.get'),
    })
    addServerHandler({
      route: options.endpoints!.register!,
      handler:
        options.handlers?.register
        || resolver.resolve('./runtime/server/api/register.get'),
    })

    if (options.debug) {
      addServerHandler({
        route: options.endpoints!.health!,
        handler:
          options.handlers?.health
          || resolver.resolve('./runtime/server/api/health.get'),
      })
    }

    addServerHandler({
      route: options.endpoints!.logout!,
      handler:
        options.handlers?.logout
        || resolver.resolve('./runtime/server/api/logout.get'),
    })

    if (nuxt.options.routeRules && Object.keys(nuxt.options.routeRules).find(key => !!nuxt.options.routeRules![key].kinde)) {
      addServerHandler({
        route: options.endpoints!.access!,
        handler:
          options.handlers?.access
          || resolver.resolve('./runtime/server/api/access.post'),
      })
    }

    // Composables
    addImports({ name: 'useAuth', as: 'useAuth', from: resolver.resolve('./runtime/composables') })
    addImports({ name: 'useKindeClient', as: 'useKindeClient', from: resolver.resolve('./runtime/composables') })

    // Middleware
    if (options.middleware) {
      addRouteMiddleware({
        name: 'auth-logged-in',
        path: resolver.resolve('./runtime/middleware/auth-logged-in'),
      })
      addRouteMiddleware({
        name: 'auth-logged-out',
        path: resolver.resolve('./runtime/middleware/auth-logged-out'),
      })
    }

    addComponent({
      name: 'LoginLink',
      filePath: resolver.resolve('./runtime/components/LoginLink'),
    })

    addComponent({
      name: 'RegisterLink',
      filePath: resolver.resolve('./runtime/components/RegisterLink'),
    })

    addTypeTemplate({
      filename: `types/nuxt-kinde.d.ts`,
      getContents: () => {
        return `
interface KindeRouteRules {
  permissions: string[]
  redirectUrl: string
}

declare module 'nitropack' {
  interface NitroRouteRules {
    kinde?: KindeRouteRules
  }
  interface NitroRouteConfig {
    kinde?: KindeRouteRules
  }
}
export {}
`
      },
    })
  },
})
