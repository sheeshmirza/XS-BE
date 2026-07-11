const platforms = require('../../constants/platforms');
const LinkedInPublishAdapter = require('./linkedinPublishAdapter');
const FacebookPublishAdapter = require('./facebookPublishAdapter');
const InstagramPublishAdapter = require('./instagramPublishAdapter');
const XPublishAdapter = require('./xPublishAdapter');

const adapterMap = {
  [platforms.LINKEDIN]: new LinkedInPublishAdapter(),
  [platforms.FACEBOOK]: new FacebookPublishAdapter(),
  [platforms.INSTAGRAM]: new InstagramPublishAdapter(),
  [platforms.X]: new XPublishAdapter()
};

const getPublishAdapter = (platform) => adapterMap[platform];

module.exports = { getPublishAdapter };
