const axios = require('axios');

class BaseOAuthAdapter {
  constructor(config) {
    this.config = config;
  }

  buildAuthorizeUrl(_state, _scopes = []) {
    throw new Error('buildAuthorizeUrl must be implemented');
  }

  async exchangeCodeForToken(_code) {
    throw new Error('exchangeCodeForToken must be implemented');
  }

  async refreshToken(_refreshToken) {
    throw new Error('refreshToken must be implemented');
  }

  async fetchUserProfile(_accessToken) {
    throw new Error('fetchUserProfile must be implemented');
  }

  async get(url, token, params = {}) {
    const { data } = await axios.get(url, {
      params,
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return data;
  }

  async post(url, body, headers = {}) {
    const { data } = await axios.post(url, body, { headers });
    return data;
  }
}

module.exports = BaseOAuthAdapter;
