//Done

import platforms from "../../constants/platforms";
import AdapterRegistry from "../../utils/AdapterRegistry";
import FacebookPublishAdapter from "./facebookPublishAdapter";
import InstagramPublishAdapter from "./instagramPublishAdapter";
import LinkedInPublishAdapter from "./linkedinPublishAdapter";
import XPublishAdapter from "./xPublishAdapter";
import YouTubePublishAdapter from "./youtubePublishAdapter";

const publishAdapterRegistry = new AdapterRegistry<any>();

publishAdapterRegistry.register(
  platforms.FACEBOOK,
  new FacebookPublishAdapter(),
);
publishAdapterRegistry.register(
  platforms.INSTAGRAM,
  new InstagramPublishAdapter(),
);
publishAdapterRegistry.register(
  platforms.LINKEDIN,
  new LinkedInPublishAdapter(),
);
publishAdapterRegistry.register(platforms.X, new XPublishAdapter());
publishAdapterRegistry.register(platforms.YOUTUBE, new YouTubePublishAdapter());

const getPublishAdapter = (platform) => publishAdapterRegistry.get(platform);
const registerPublishAdapter = (platform, adapter) => {
  publishAdapterRegistry.register(platform, adapter);
};

export { getPublishAdapter, registerPublishAdapter };
