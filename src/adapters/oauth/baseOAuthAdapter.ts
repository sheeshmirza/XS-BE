import axios from "axios";
import ApiError from "../../utils/ApiError";
import httpStatus from "../../constants/httpStatus";

class BaseOAuthAdapter {
  config: any;
  constructor(config) {
    this.config = config;
  }

  shouldDebugOAuthLogs() {
    return (
      String(process.env.OAUTH_DEBUG_LOGS || "").toLowerCase() === "true" ||
      process.env.NODE_ENV !== "production"
    );
  }

  maskSecret(value) {
    const text = String(value || "");
    if (!text) {
      return "";
    }
    if (text.length <= 10) {
      return `${text.slice(0, 2)}***`;
    }
    return `${text.slice(0, 6)}...${text.slice(-4)}`;
  }

  redactHeaders(headers: Record<string, string> = {}) {
    const sanitized = { ...headers };
    if (sanitized.Authorization) {
      sanitized.Authorization = this.maskSecret(sanitized.Authorization);
    }
    return sanitized;
  }

  logOAuthDebug(event, payload) {
    if (!this.shouldDebugOAuthLogs()) {
      return;
    }
    console.log(`[OAuthDebug] ${event}`, JSON.stringify(payload, null, 2));
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
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    this.logOAuthDebug("request", {
      method: "GET",
      url,
      params,
      headers: this.redactHeaders(headers),
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
          headers: this.redactHeaders(headers),
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
      headers: this.redactHeaders(headers),
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
          headers: this.redactHeaders(headers),
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
