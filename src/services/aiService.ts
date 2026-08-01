import axios from "axios";

import env from "../config/env";
import ApiError from "../utils/ApiError";
import httpStatus from "../constants/httpStatus";

class AiService {
  private baseUrl: string;

  private timeout: number;

  constructor() {
    this.baseUrl = String(env.aiWrapperBaseUrl || "").replace(/\/$/, "");
    this.timeout = Number(env.aiWrapperTimeoutMs) > 0 ? Number(env.aiWrapperTimeoutMs) : 30000;
  }

  private ensureConfigured() {
    if (!this.baseUrl) {
      throw new ApiError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "AI service is not configured. Set AI_WRAPPER_BASE_URL",
      );
    }
  }

  private mapGoogleQuotaMessage(statusCode: number | undefined, upstreamMessage: string) {
    if (statusCode !== httpStatus.TOO_MANY_REQUESTS) {
      return null;
    }

    const normalizedMessage = String(upstreamMessage || "").toLowerCase();
    const isGoogleQuotaError =
      normalizedMessage.includes("resource_exhausted") ||
      normalizedMessage.includes("quota exceeded") ||
      normalizedMessage.includes("rate-limits");

    if (!isGoogleQuotaError) {
      return null;
    }

    if (normalizedMessage.includes("flash-image") || normalizedMessage.includes("image")) {
      return "Google free tier image generation is not available for the current key/model. Use text generation only or enable paid Google AI quota.";
    }

    return "Google AI quota exceeded for the current key/model. Retry later or use a lower-cost model.";
  }

  private mapRequestError(error: any) {
    if (axios.isAxiosError(error)) {
      const statusCode = error.response?.status;
      const upstreamData = error.response?.data;
      const upstreamMessage =
        upstreamData?.error ||
        upstreamData?.message ||
        error.message ||
        "AI provider request failed";

      if (statusCode) {
        const mappedMessage = this.mapGoogleQuotaMessage(statusCode, upstreamMessage);
        throw new ApiError(statusCode, mappedMessage || upstreamMessage, {
          upstream: upstreamData || null,
        });
      }

      if (error.code === "ECONNABORTED") {
        throw new ApiError(
          httpStatus.GATEWAY_TIMEOUT,
          "AI service request timed out",
        );
      }

      throw new ApiError(
        httpStatus.BAD_GATEWAY,
        "AI service is currently unavailable",
      );
    }

    throw error;
  }

  async generateText(payload: {
    provider: string;
    model: string;
    prompt: string;
    system_prompt?: string;
    max_tokens?: number;
    temperature?: number;
    stream?: boolean;
  }) {
    this.ensureConfigured();
    try {
      const response = await axios.post(`${this.baseUrl}/api/v1/text`, payload, {
        timeout: this.timeout,
        headers: {
          "Content-Type": "application/json",
        },
      });
      return response.data;
    } catch (error) {
      this.mapRequestError(error);
    }
  }

  async generateImage(payload: {
    provider: string;
    model: string;
    prompt: string;
    size?: string;
    count?: number;
    quality?: string;
    format?: string;
  }) {
    this.ensureConfigured();
    try {
      const response = await axios.post(`${this.baseUrl}/api/v1/image`, payload, {
        timeout: this.timeout,
        headers: {
          "Content-Type": "application/json",
        },
      });
      return response.data;
    } catch (error) {
      this.mapRequestError(error);
    }
  }
}

export default new AiService();