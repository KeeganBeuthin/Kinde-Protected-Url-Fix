export default defineNuxtRouteMiddleware(async () => {
    console.log('🚦 Auth middleware executing, environment:', process.env.NODE_ENV);
    const client = useKindeClient();
    
    if (!client) {
        console.error('❌ No Kinde client available');
        return;
    }

    try {
        const isAuth = await client.isAuthenticated();
        console.log('🔐 Authentication status:', isAuth);
        
        if (isAuth) {
            const token = await client.getToken();
            console.log('🎫 Token retrieved successfully');
            useState('token', () => token);
            return true;
        } else {
            console.log('🔄 Redirecting to login');
            useState('token', () => null);
            return navigateTo('/api/login', {external:true});
        }
    } catch (error) {
        console.error('❌ Auth middleware error:', error);
        throw error;
    }
})