import { defineEventHandler, sendRedirect, getQuery } from 'h3'
import { getKindeClient } from '../utils/client'
import { useRuntimeConfig } from '#imports'

export default defineEventHandler(async (event) => {
  console.log('📥 Login request received');
  const config = useRuntimeConfig();
  const kindeSettings = {
    ...config.kinde,
    ...config.public.kinde
  };
  
  const query: Record<string, string> = getQuery(event);
  const sessionManager = event.context.kinde.sessionManager;

  // Store post-login redirect if provided
  if (query.postLoginRedirectURL) {
    await sessionManager.setSessionItem('post-login-redirect-url', query.postLoginRedirectURL);
  }

  try {
    const client = getKindeClient();
    // Generate and store state before redirects
    const state = crypto.randomUUID();
    await sessionManager.setSessionItem('oauth_state', state);

    const loginURL = await client.login(sessionManager, {
      authUrlParams: {
        ...(kindeSettings.audience && { audience: kindeSettings.audience }),
        state,
        ...query,
      },
    });

    console.log('🔒 Login security check:', { 
      hasState: !!state,
      hasSession: !!sessionManager 
    });

    await sendRedirect(event, loginURL.href);
  } catch (error) {
    console.error('❌ Login error:', error);
    throw error;
  }
})
