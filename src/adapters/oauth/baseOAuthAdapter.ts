//Done

import axios from "axios";

import httpStatus from "../../constants/httpStatus";
import ApiError from "../../utils/ApiError";

class BaseOAuthAdapter {

  config: any;
  
  constructor(config) {
    this.config = config;
  }

  logOAuthDebug(event, payload) {
    console.log(`[OAuthDebug] ${event}`, JSON.stringify(payload, null, 2));
  }

  buildAuthorizeUrl(_state, _scopes = []) {
    throw new Error("BuildAuthorizeUrl must be implemented");
  }

  async exchangeCodeForToken(_code, _context?): Promise<any> {
    throw new Error("ExchangeCodeForToken must be implemented");
  }
  
  async refreshToken(_refreshToken): Promise<any> {
    throw new Error("RefreshToken must be implemented");
  }
  
  async fetchUserProfile(_accessToken): Promise<any> {
    throw new Error("FetchUserProfile must be implemented");
  }
  
  async get(url, token, params = {}) {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    this.logOAuthDebug("request", {
      method: "GET",
      url,
      params,
      headers,
    });
    try {
      const response = await axios.get(url, {
        params,
        headers,
      });
      this.logOAuthDebug("response", {
        method: "GET",
        url,
        status: response.status,
        data: response.data,
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const providerStatus = error.response?.status || null;
        this.logOAuthDebug("error", {
          method: "GET",
          url,
          params,
          headers,
          providerStatus,
          providerData: error.response?.data || null,
        });
        const statusCode =
          providerStatus && providerStatus >= 400 && providerStatus < 500
            ? httpStatus.BAD_REQUEST
            : httpStatus.INTERNAL_SERVER_ERROR;
        throw new ApiError(statusCode, "OAuth provider request failed", {
          providerStatus,
          providerData: error.response?.data || null,
          providerUrl: url,
        });
      }
      throw error;
    }
  }

  async post(url, body, headers = {}) {
    this.logOAuthDebug("request", {
      method: "POST",
      url,
      headers,
      body,
    });
    try {
      const response = await axios.post(url, body, { headers });
      this.logOAuthDebug("response", {
        method: "POST",
        url,
        status: response.status,
        data: response.data,
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const providerStatus = error.response?.status || null;
        this.logOAuthDebug("error", {
          method: "POST",
          url,
          headers,
          body,
          providerStatus,
          providerData: error.response?.data || null,
        });
        const statusCode =
          providerStatus && providerStatus >= 400 && providerStatus < 500
            ? httpStatus.BAD_REQUEST
            : httpStatus.INTERNAL_SERVER_ERROR;
        throw new ApiError(statusCode, "OAuth provider request failed", {
          providerStatus,
          providerData: error.response?.data || null,
          providerUrl: url,
        });
      }
      throw error;
    }
  }
}

export default BaseOAuthAdapter;
