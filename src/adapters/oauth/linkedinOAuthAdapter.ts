import qs from "querystring";
import axios from "axios";
import BaseOAuthAdapter from "./baseOAuthAdapter";

class LinkedInOAuthAdapter extends BaseOAuthAdapter {
  buildAuthorizeUrl(
    state,
    scopes = [
      "email",
      "openid",
      "profile",
      "r_1st_connections_size",
      "r_ads",
      "r_ads_reporting",
      "r_basicprofile",
      "r_events",
      "r_organization_admin",
      "r_organization_social",
      "rw_ads",
      "rw_events",
      "rw_organization_admin",
      "w_member_social",
      "w_organization_social",
    ],
  ) {
    const requestedScopes =
      Array.isArray(this.config?.scopes) && this.config.scopes.length
        ? this.config.scopes
        : scopes;

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

      // /me returns the canonical LinkedIn member id used for person URNs.
      let memberId = "";
      try {
        const me = await this.get("https://api.linkedin.com/v2/me", accessToken);
        memberId = me?.id || "";
      } catch (_error) {
        memberId = "";
      }

      return {
        platformUserId: memberId || profile.sub,
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

  async fetchManagedPages(accessToken) {
    try {
      const response = await axios.get(
        "https://api.linkedin.com/v2/organizationAcls",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "X-Restli-Protocol-Version": "2.0.0",
            "LinkedIn-Version": "202405",
          },
          params: {
            q: "roleAssignee",
            projection:
              "(elements*(organization~(id,localizedName,vanityName,logoV2(original~:playableStreams)),roleAssignee,state,role,organization))",
            start: 0,
            count: 50,
          },
        },
      );

      const elements = Array.isArray(response?.data?.elements)
        ? response.data.elements
        : [];

      const pages = [];
      for (const element of elements) {
        if (element?.state !== "APPROVED") {
          continue;
        }

        const org = element?.["organization~"];
        const rawOrgId = org?.id || element?.organization || "";
        const orgId = String(rawOrgId)
          .replace(/^urn:li:organization:/, "")
          .trim();
        if (!orgId) {
          continue;
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
          accountType: "organization",
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
