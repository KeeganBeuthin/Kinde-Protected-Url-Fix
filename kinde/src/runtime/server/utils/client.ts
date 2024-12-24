import { createKindeServerClient, GrantType } from '@kinde-oss/kinde-typescript-sdk'
import type { ACClient } from '@kinde-oss/kinde-typescript-sdk'
// @ts-expect-error virtual file
import { version as frameworkVersion } from 'kinde-version.mjs'
import { useRuntimeConfig } from '#imports'

let kindeClient: ACClient

export const getKindeClient = () => {
  if (kindeClient) {
    console.log('🔑 Returning existing Kinde client');
    return kindeClient;
  }

  const config = useRuntimeConfig();
  console.log('🔧 Debug - Runtime Config Structure:', {
    hasPublicKinde: !!config.public?.kinde,
    hasPrivateKinde: !!config.kinde,
    publicKindeKeys: config.public?.kinde ? Object.keys(config.public.kinde) : [],
    privateKindeKeys: config.kinde ? Object.keys(config.kinde) : [],
    fullPublicConfig: config.public?.kinde,
    env: process.env.NODE_ENV
  });

  try {
    kindeClient = createKindeServerClient(GrantType.AUTHORIZATION_CODE, {
      authDomain: config.public?.kinde?.authDomain,
      clientId: config.public?.kinde?.clientId,
      clientSecret: config.kinde?.clientSecret,
      logoutRedirectURL: config.public?.kinde?.logoutRedirectURL,
      redirectURL: config.public?.kinde?.redirectURL,
      framework: 'Nuxt',
      frameworkVersion,
    });
    console.log('✅ Kinde client created with config:', {
      authDomain: config.public?.kinde?.authDomain,
      hasClientId: !!config.public?.kinde?.clientId,
      hasClientSecret: !!config.kinde?.clientSecret,
      hasRedirectURL: !!config.public?.kinde?.redirectURL
    });
    return kindeClient;
  } catch (error) {
    console.error('❌ Failed to create Kinde client:', error);
    throw error;
  }
}
