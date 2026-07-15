import env from "../../config/env";
import platforms from "../../constants/platforms";
import LinkedInOAuthAdapter from "./linkedinOAuthAdapter";
import FacebookOAuthAdapter from "./facebookOAuthAdapter";
import InstagramOAuthAdapter from "./instagramOAuthAdapter";
import XOAuthAdapter from "./xOAuthAdapter";
const adapterMap = {
  [platforms.LINKEDIN]: new LinkedInOAuthAdapter(env.oauth.linkedin),
  [platforms.FACEBOOK]: new FacebookOAuthAdapter(env.oauth.facebook),
  [platforms.INSTAGRAM]: new InstagramOAuthAdapter(env.oauth.instagram),
  [platforms.X]: new XOAuthAdapter(env.oauth.x),
};
const getOAuthAdapter = (platform) => adapterMap[platform];
export { getOAuthAdapter };
