import qs from "querystring";
import axios from "axios";
import BaseOAuthAdapter from "./baseOAuthAdapter";
import { LinkedInAccountType } from "../../constants/accountTypes";

const LINKEDIN_OAUTH_SCOPES = [
  "openid",
  "profile",
  "email",
  "w_member_social",
  "r_organization_admin",
  "r_organization_social",
  "w_organization_social",
];

class LinkedInOAuthAdapter extends BaseOAuthAdapter {
  logLinkedInDebug(event, payload) {
    if (!this.shouldDebugOAuthLogs()) {
      return;
    }
    console.log(
      `[LinkedInOAuthDebug] ${event}`,
      JSON.stringify(payload, null, 2),
    );
  }

  buildAuthorizeUrl(state) {
    const requestedScopes = LINKEDIN_OAUTH_SCOPES;

    const query = qs.stringify({
      response_type: "code",
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      state,
      scope: requestedScopes.join(" "),
    });
    return `https://www.linkedin.com/oauth/v2/authorization?${query}`;
  }
  async exchangeCodeForToken(code) {
    const body = qs.stringify({
      grant_type: "authorization_code",
      code,
      redirect_uri: this.config.redirectUri,
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
    });
    return this.post("https://www.linkedin.com/oauth/v2/accessToken", body, {
      "Content-Type": "application/x-www-form-urlencoded",
    });
  }
  async refreshToken(refreshToken) {
    const body = qs.stringify({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
    });
    return this.post("https://www.linkedin.com/oauth/v2/accessToken", body, {
      "Content-Type": "application/x-www-form-urlencoded",
    });
  }
  async fetchUserProfile(accessToken) {
    try {
      // New LinkedIn OAuth products expose OpenID userinfo.
      const profile = await this.get(
        "https://api.linkedin.com/v2/userinfo",
        accessToken,
      );

      return {
        platformUserId: profile.sub,
        username: profile.email || profile.name || profile.sub,
        displayName:
          profile.name ||
          `${profile.given_name || ""} ${profile.family_name || ""}`.trim() ||
          profile.sub,
        profilePicture: profile.picture || "",
        metadata: {
          subjectId: profile.sub,
          email: profile.email,
          emailVerified: profile.email_verified,
          locale: profile.locale,
        },
      };
    } catch (_error) {
      // Fallback for legacy apps that still depend on r_liteprofile.
      const profile = await this.get(
        "https://api.linkedin.com/v2/me",
        accessToken,
      );

      return {
        platformUserId: profile.id,
        username: profile.localizedFirstName || profile.id,
        displayName:
          `${profile.localizedFirstName || ""} ${profile.localizedLastName || ""}`.trim(),
        profilePicture: "",
      };
    }
  }

  extractLocalizedName(value, fallback = "Organization") {
    if (!value) {
      return fallback;
    }
    if (typeof value === "string") {
      return value;
    }
    if (value.localized && typeof value.localized === "object") {
      const first = Object.values(value.localized)[0];
      if (typeof first === "string" && first.trim()) {
        return first;
      }
    }
    return fallback;
  }

  extractOrganizationLogo(logoData) {
    try {
      const streams = logoData?.["original~"]?.elements;
      if (!Array.isArray(streams) || streams.length === 0) {
        return "";
      }
      return streams?.[0]?.identifiers?.[0]?.identifier || "";
    } catch (_error) {
      return "";
    }
  }

  normalizeOrganizationId(value) {
    if (!value) {
      return "";
    }

    if (typeof value === "object") {
      const candidate =
        value?.id ||
        value?.organization ||
        value?.organizationTarget ||
        value?.organizationalTarget ||
        value?.entity ||
        value?.urn ||
        value?.value ||
        "";
      return this.normalizeOrganizationId(candidate);
    }

    return String(value)
      .replace(/^urn:li:(organization|company):/, "")
      .trim();
  }

  normalizeMemberId(value) {
    return String(value || "")
      .replace(/^urn:li:person:/, "")
      .trim();
  }

  isApprovedState(value) {
    const normalized = String(value || "")
      .trim()
      .toUpperCase();
    if (!normalized) {
      return false;
    }
    return normalized.includes("APPROVED");
  }

  async fetchOrganizationDetails(accessToken, organizationId) {
    const requests = [
      {
        url: `https://api.linkedin.com/v2/organizations/${organizationId}`,
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "X-Restli-Protocol-Version": "2.0.0",
          "LinkedIn-Version": "202405",
        },
        params: {
          projection:
            "(id,localizedName,vanityName,logoV2(original~:playableStreams))",
        },
      },
      {
        url: `https://api.linkedin.com/rest/organizations/${organizationId}`,
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "X-Restli-Protocol-Version": "2.0.0",
          "Linkedin-Version": "202607",
        },
        params: {},
      },
    ];

    for (const req of requests) {
      try {
        this.logLinkedInDebug("request", {
          method: "GET",
          url: req.url,
          params: req.params,
          headers: this.redactHeaders(req.headers),
        });
        const response = await axios.get(req.url, {
          headers: req.headers,
          params: req.params,
        });
        this.logLinkedInDebug("response", {
          method: "GET",
          url: req.url,
          status: response.status,
          data: response.data,
        });
        return response?.data || null;
      } catch (error) {
        this.logLinkedInDebug("error", {
          method: "GET",
          url: req.url,
          status: error?.response?.status || null,
          data: error?.response?.data || null,
        });
        // Try next endpoint variant.
      }
    }

    return null;
  }

  async fetchManagedPages(accessToken, profile = null) {
    const requestVariants = [
      {
        url: "https://api.linkedin.com/v2/organizationAcls",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "X-Restli-Protocol-Version": "2.0.0",
        },
        params: {
          q: "roleAssignee",
          count: 100,
        },
      },
      {
        url: "https://api.linkedin.com/v2/organizationAcls",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "X-Restli-Protocol-Version": "2.0.0",
        },
        params: {
          q: "roleAssignee",
          count: 100,
          // Fallback for LinkedIn tenants that require roleAssignee.
          ...(this.normalizeMemberId(profile?.platformUserId)
            ? {
                roleAssignee: `urn:li:person:${this.normalizeMemberId(profile?.platformUserId)}`,
              }
            : {}),
        },
      },
    ];

    const collectElements = (payload) => {
      if (Array.isArray(payload?.elements)) {
        return payload.elements;
      }
      if (Array.isArray(payload?.results)) {
        return payload.results;
      }
      if (Array.isArray(payload?.data)) {
        return payload.data;
      }
      return [];
    };

    const fetchVariantElements = async (variant) => {
      const pageSize = Number(variant?.params?.count || 100);
      const maxPages = 20;
      let start = 0;
      let page = 0;
      const aggregated = [];

      while (page < maxPages) {
        this.logLinkedInDebug("request", {
          method: "GET",
          url: variant.url,
          params: {
            ...(variant.params || {}),
            start,
            count: pageSize,
          },
          headers: this.redactHeaders(variant.headers),
        });
        const response = await axios.get(variant.url, {
          headers: variant.headers,
          params: {
            ...(variant.params || {}),
            start,
            count: pageSize,
          },
        });
        this.logLinkedInDebug("response", {
          method: "GET",
          url: variant.url,
          status: response.status,
          data: response.data,
        });

        const payload = response?.data || {};
        const nextElements = collectElements(payload);
        if (!nextElements.length) {
          break;
        }

        aggregated.push(...nextElements);

        const total = Number(payload?.paging?.total || 0);
        start += pageSize;
        page += 1;

        if (total > 0 && start >= total) {
          break;
        }
        if (nextElements.length < pageSize) {
          break;
        }
      }

      return aggregated;
    };

    let elements = [];
    for (const variant of requestVariants) {
      try {
        const nextElements = await fetchVariantElements(variant);
        if (nextElements.length > 0) {
          elements = nextElements;
          break;
        }
      } catch (error) {
        this.logLinkedInDebug("error", {
          method: "GET",
          url: variant.url,
          params: variant.params,
          headers: this.redactHeaders(variant.headers),
          status: error?.response?.status || null,
          data: error?.response?.data || null,
        });
        // Try next query variant.
      }
    }

    try {
      if (!elements.length) {
        return [];
      }

      const pages = [];
      const seenOrgIds = new Set<string>();
      const organizationCache = new Map<string, any>();
      for (const element of elements) {
        const approvalState =
          typeof element?.state === "string"
            ? element.state
            : element?.state?.value || "";
        if (!this.isApprovedState(approvalState)) {
          continue;
        }

        const rawOrganization =
          element?.["organization~"] ||
          element?.["organizationalTarget~"] ||
          null;

        const rawOrgId =
          rawOrganization?.id ||
          element?.organization ||
          element?.organizationTarget ||
          element?.organizationalTarget ||
          "";

        const orgId = this.normalizeOrganizationId(rawOrgId);
        if (!orgId) {
          continue;
        }
        if (seenOrgIds.has(orgId)) {
          continue;
        }
        seenOrgIds.add(orgId);

        let org = rawOrganization;
        if (!org || (!org.localizedName && !org.vanityName)) {
          if (!organizationCache.has(orgId)) {
            const detail = await this.fetchOrganizationDetails(
              accessToken,
              orgId,
            );
            organizationCache.set(orgId, detail);
          }
          org = organizationCache.get(orgId) || org;
        }

        const orgName =
          this.extractLocalizedName(org?.localizedName, "") ||
          org?.vanityName ||
          "LinkedIn Organization";

        pages.push({
          id: orgId,
          platformUserId: orgId,
          username: orgName,
          name: orgName,
          displayName: orgName,
          profilePicture: this.extractOrganizationLogo(org?.logoV2),
          accountType: LinkedInAccountType.ORGANIZATION,
          metadata: {
            role: element?.role || "MEMBER",
            state: element?.state || "",
            organizationUrn: `urn:li:organization:${orgId}`,
          },
        });
      }

      return pages;
    } catch (_error) {
      // Missing org scopes commonly returns 403; caller handles empty page list gracefully.
      return [];
    }
  }
}
export default LinkedInOAuthAdapter;
