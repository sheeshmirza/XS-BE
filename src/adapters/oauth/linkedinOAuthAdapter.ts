import qs from 'querystring';
import BaseOAuthAdapter from './baseOAuthAdapter';
class LinkedInOAuthAdapter extends BaseOAuthAdapter { buildAuthorizeUrl(state, scopes = ['r_liteprofile', 'r_emailaddress', 'w_member_social']) { const query = qs.stringify({ response_type: 'code',
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      state,
      scope: scopes.join(' ') });
    return `https://www.linkedin.com/oauth/v2/authorization?${query}`; }
  async exchangeCodeForToken(code) { const body = qs.stringify({ grant_type: 'authorization_code',
      code,
      redirect_uri: this.config.redirectUri,
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret });
    return this.post('https://www.linkedin.com/oauth/v2/accessToken', body, { 'Content-Type': 'application/x-www-form-urlencoded' }); }
  async refreshToken(refreshToken) { const body = qs.stringify({ grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret });
    return this.post('https://www.linkedin.com/oauth/v2/accessToken', body, { 'Content-Type': 'application/x-www-form-urlencoded' }); }
  async fetchUserProfile(accessToken) { const profile = await this.get('https://api.linkedin.com/v2/me', accessToken);
    return { platformUserId: profile.id,
      username: profile.localizedFirstName || profile.id,
      displayName: `${profile.localizedFirstName || ''} ${profile.localizedLastName || ''}`.trim(),
      profilePicture: '' }; } }
export default LinkedInOAuthAdapter;
