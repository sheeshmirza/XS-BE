//Done

import env from "../../config/env";
import platforms from "../../constants/platforms";
import AdapterRegistry from "../../utils/AdapterRegistry";

import FacebookOAuthAdapter from "./facebookOAuthAdapter";
import InstagramOAuthAdapter from "./instagramOAuthAdapter";
import LinkedInOAuthAdapter from "./linkedinOAuthAdapter";
import XOAuthAdapter from "./xOAuthAdapter";
import YouTubeOAuthAdapter from "./youtubeOAuthAdapter";

const oauthAdapterRegistry = new AdapterRegistry<any>();

oauthAdapterRegistry.register(
  platforms.FACEBOOK,
  new FacebookOAuthAdapter(env.oauth.facebook),
);
oauthAdapterRegistry.register(
  platforms.INSTAGRAM,
  new InstagramOAuthAdapter(env.oauth.instagram),
);
oauthAdapterRegistry.register(
  platforms.LINKEDIN,
  new LinkedInOAuthAdapter(env.oauth.linkedin),
);
oauthAdapterRegistry.register(platforms.X, new XOAuthAdapter(env.oauth.x));
oauthAdapterRegistry.register(
  platforms.YOUTUBE,
  new YouTubeOAuthAdapter(env.oauth.youtube),
);

const getOAuthAdapter = (platform) => oauthAdapterRegistry.get(platform);
const registerOAuthAdapter = (platform, adapter) => {
  oauthAdapterRegistry.register(platform, adapter);
};

export { getOAuthAdapter, registerOAuthAdapter };
