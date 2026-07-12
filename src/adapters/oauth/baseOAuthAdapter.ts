import axios from "axios";

class BaseOAuthAdapter {
  config: any;
  constructor(config) {
    this.config = config;
  }
  buildAuthorizeUrl(_state, _scopes = []) {
    throw new Error("buildAuthorizeUrl must be implemented");
  }
  async exchangeCodeForToken(_code): Promise<any> {
    throw new Error("exchangeCodeForToken must be implemented");
  }
  async refreshToken(_refreshToken): Promise<any> {
    throw new Error("refreshToken must be implemented");
  }
  async fetchUserProfile(_accessToken): Promise<any> {
    throw new Error("fetchUserProfile must be implemented");
  }
  async get(url, token, params = {}) {
    const { data } = await axios.get(url, {
      params,
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  }
  async post(url, body, headers = {}) {
    const { data } = await axios.post(url, body, { headers });
    return data;
  }
}
export default BaseOAuthAdapter;
