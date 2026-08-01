import qs from "querystring";
import BaseOAuthAdapter from "./baseOAuthAdapter";
import { YouTubeAccountType } from "../../constants/accountTypes";

class YouTubeOAuthAdapter extends BaseOAuthAdapter {
  buildAuthorizeUrl(
    state,
    scopes = [
      "openid",
      "profile",
      "email",
      "https://www.googleapis.com/auth/youtube.upload",
      "https://www.googleapis.com/auth/youtube.readonly",
    ],
  ) {
    const query = qs.stringify({
      response_type: "code",
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      state,
      scope: scopes.join(" "),
      access_type: "offline",
      prompt: "consent",
      include_granted_scopes: "true",
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${query}`;
  }

  async exchangeCodeForToken(code) {
    const body = qs.stringify({
      grant_type: "authorization_code",
      code,
      redirect_uri: this.config.redirectUri,
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
    });

    return this.post("https://oauth2.googleapis.com/token", body, {
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

    return this.post("https://oauth2.googleapis.com/token", body, {
      "Content-Type": "application/x-www-form-urlencoded",
    });
  }

  async fetchUserProfile(accessToken) {
    const profile = await this.get(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      accessToken,
    );

    return {
      platformUserId: profile.sub,
      username: profile.email || profile.name || profile.sub,
      displayName: profile.name || profile.email || profile.sub,
      profilePicture: profile.picture || "",
      accountType: YouTubeAccountType.CHANNEL,
      metadata: {
        email: profile.email || "",
        emailVerified: Boolean(profile.email_verified),
      },
    };
  }
}

export default YouTubeOAuthAdapter;
