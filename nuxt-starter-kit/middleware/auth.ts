export default defineNuxtRouteMiddleware(async () => {
    const client = useKindeClient();
    if (client) {
        const isAuth = await client.isAuthenticated();
        console.log('🔗 isAuth', isAuth);
        if (isAuth) {
            const token = await client.getToken();
            useState('token', () => token);
            return true;
        }else{
            useState('token', () => null);
            return navigateTo('/api/login', {external:true});
        }
    }
})