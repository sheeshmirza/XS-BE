import qs from 'querystring';
import BaseOAuthAdapter from './baseOAuthAdapter';
class XOAuthAdapter extends BaseOAuthAdapter { buildAuthorizeUrl(state, scopes = ['tweet.read', 'tweet.write', 'users.read', 'offline.access']) { const query = qs.stringify({ response_type: 'code',
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      state,
      scope: scopes.join(' '),
      code_challenge: state,
      code_challenge_method: 'plain' });
    return `https://twitter.com/i/oauth2/authorize?${query}`; }
  async exchangeCodeForToken(code) { const body = qs.stringify({ grant_type: 'authorization_code',
      code,
      redirect_uri: this.config.redirectUri,
      client_id: this.config.clientId,
      code_verifier: code });
    const basic = Buffer.from(`${this.config.clientId}:${this.config.clientSecret}`).toString('base64');
    return this.post('https://api.twitter.com/2/oauth2/token', body, { 'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${basic}` }); }
  async refreshToken(refreshToken) { const body = qs.stringify({ grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: this.config.clientId });
    const basic = Buffer.from(`${this.config.clientId}:${this.config.clientSecret}`).toString('base64');
    return this.post('https://api.twitter.com/2/oauth2/token', body, { 'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${basic}` }); }
  async fetchUserProfile(accessToken) { const data = await this.get('https://api.twitter.com/2/users/me', accessToken, { 'user.fields': 'profile_image_url' });
    const user = data.data || {};
    return { platformUserId: user.id,
      username: user.username,
      displayName: user.name,
      profilePicture: user.profile_image_url || '' }; } }
export default XOAuthAdapter;
