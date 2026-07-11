const env = require('../../config/env');
const platforms = require('../../constants/platforms');
const LinkedInOAuthAdapter = require('./linkedinOAuthAdapter');
const FacebookOAuthAdapter = require('./facebookOAuthAdapter');
const InstagramOAuthAdapter = require('./instagramOAuthAdapter');
const XOAuthAdapter = require('./xOAuthAdapter');

const adapterMap = {
  [platforms.LINKEDIN]: new LinkedInOAuthAdapter(env.oauth.linkedin),
  [platforms.FACEBOOK]: new FacebookOAuthAdapter(env.oauth.facebook),
  [platforms.INSTAGRAM]: new InstagramOAuthAdapter(env.oauth.instagram),
  [platforms.X]: new XOAuthAdapter(env.oauth.x)
};

const getOAuthAdapter = (platform) => adapterMap[platform];

module.exports = { getOAuthAdapter };
