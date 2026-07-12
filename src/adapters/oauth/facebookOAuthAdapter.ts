import qs from 'querystring';
import BaseOAuthAdapter from './baseOAuthAdapter';
class FacebookOAuthAdapter extends BaseOAuthAdapter { buildAuthorizeUrl(state, scopes = ['pages_manage_posts', 'pages_read_engagement']) { const query = qs.stringify({ response_type: 'code',
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      state,
      scope: scopes.join(',') });
    return `https://www.facebook.com/v19.0/dialog/oauth?${query}`; }
  async exchangeCodeForToken(code) { return this.get('https://graph.facebook.com/v19.0/oauth/access_token', '', { client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      redirect_uri: this.config.redirectUri,
      code }); }
  async refreshToken(_refreshToken) { return null; }
  async fetchUserProfile(accessToken) { const data = await this.get('https://graph.facebook.com/me', accessToken, { fields: 'id,name,picture' });
    return { platformUserId: data.id,
      username: data.name,
      displayName: data.name,
      profilePicture: data.picture?.data?.url || '' }; } }
export default FacebookOAuthAdapter;
