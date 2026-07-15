import qs from "querystring";
import BaseOAuthAdapter from "./baseOAuthAdapter";
import { FacebookAccountType } from "../../constants/accountTypes";

class FacebookOAuthAdapter extends BaseOAuthAdapter {
  buildAuthorizeUrl(
    state,
    scopes = ["pages_manage_posts", "pages_read_engagement", "pages_show_list"],
  ) {
    const query = qs.stringify({
      response_type: "code",
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      state,
      scope: scopes.join(","),
    });
    return `https://www.facebook.com/v19.0/dialog/oauth?${query}`;
  }

  async exchangeCodeForToken(code) {
    return this.get("https://graph.facebook.com/v19.0/oauth/access_token", "", {
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      redirect_uri: this.config.redirectUri,
      code,
    });
  }

  async refreshToken(_refreshToken) {
    return null;
  }

  async fetchUserProfile(accessToken) {
    const data = await this.get("https://graph.facebook.com/me", accessToken, {
      fields: "id,name,picture",
    });
    return {
      platformUserId: data.id,
      username: data.name,
      displayName: data.name,
      profilePicture: data.picture?.data?.url || "",
    };
  }

  async fetchManagedPages(accessToken, profile) {
    try {
      const payload = await this.get(
        "https://graph.facebook.com/v19.0/me/accounts",
        accessToken,
        { fields: "id,name,access_token,picture{url},category,perms" },
      );

      const pages = Array.isArray(payload?.data) ? payload.data : [];
      return pages.map((page) => ({
        id: page.id,
        platformUserId: page.id,
        username: page.name || page.id,
        name: page.name || "Facebook Page",
        displayName: page.name || "Facebook Page",
        profilePicture: page?.picture?.data?.url || "",
        accessToken: page.access_token || accessToken,
        accountType: FacebookAccountType.PAGE,
        metadata: {
          category: page.category || "",
          perms: Array.isArray(page.perms) ? page.perms : [],
          parentPlatformUserId: profile?.platformUserId || "",
        },
      }));
    } catch (_error) {
      return [];
    }
  }
}

export default FacebookOAuthAdapter;
