import platforms from '../../constants/platforms';
import LinkedInPublishAdapter from './linkedinPublishAdapter';
import FacebookPublishAdapter from './facebookPublishAdapter';
import InstagramPublishAdapter from './instagramPublishAdapter';
import XPublishAdapter from './xPublishAdapter';
const adapterMap = { [platforms.LINKEDIN]: new LinkedInPublishAdapter(),
  [platforms.FACEBOOK]: new FacebookPublishAdapter(),
  [platforms.INSTAGRAM]: new InstagramPublishAdapter(),
  [platforms.X]: new XPublishAdapter() };
const getPublishAdapter = (platform) => adapterMap[platform];
export { getPublishAdapter };
