import qs from "querystring";
import BaseOAuthAdapter from "./baseOAuthAdapter";

class InstagramOAuthAdapter extends BaseOAuthAdapter {
  buildAuthorizeUrl(
    state,
    scopes = [
      "instagram_business_basic",
      "instagram_business_content_publish",
      "instagram_business_manage_comments",
      "instagram_business_manage_insights",
      "instagram_business_manage_messages",
    ],
  ) {
    const query = qs.stringify({
      response_type: "code",
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      state,
      scope: scopes.join(","),
    });
    console.log(
      "InstagramOAuthAdapter.buildAuthorizeUrl",
      `https://api.instagram.com/oauth/authorize?${query}`,
    );
    return `https://api.instagram.com/oauth/authorize?${query}`;
  }
  async exchangeCodeForToken(code) {
    const body = qs.stringify({
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      grant_type: "authorization_code",
      redirect_uri: this.config.redirectUri,
      code,
    });
    return this.post("https://api.instagram.com/oauth/access_token", body, {
      "Content-Type": "application/x-www-form-urlencoded",
    });
  }
  async refreshToken(refreshToken) {
    return this.get("https://graph.instagram.com/refresh_access_token", "", {
      grant_type: "ig_refresh_token",
      access_token: refreshToken,
    });
  }
  async fetchUserProfile(accessToken) {
    const data = await this.get("https://graph.instagram.com/me", accessToken, {
      fields: "id,username",
    });
    return {
      platformUserId: data.id,
      username: data.username,
      displayName: data.username,
      profilePicture: "",
    };
  }
}
export default InstagramOAuthAdapter;
