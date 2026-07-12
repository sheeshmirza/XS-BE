//Reviewed

import dotenv from "dotenv";

dotenv.config();

export default {
  bcryptSaltRounds: Number(process.env.BCRYPT_SALT_ROUNDS),
  clientUrl: process.env.CLIENT_URL,
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN,
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET,
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
  mongodbDbName: process.env.MONGODB_DB_NAME,
  mongodbUri: process.env.MONGODB_URI,
  oauth: {
    facebook: {
      clientId: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
      redirectUri: process.env.FACEBOOK_REDIRECT_URI,
    },
    instagram: {
      clientId: process.env.INSTAGRAM_CLIENT_ID,
      clientSecret: process.env.INSTAGRAM_CLIENT_SECRET,
      redirectUri: process.env.INSTAGRAM_REDIRECT_URI,
    },
    linkedin: {
      clientId: process.env.LINKEDIN_CLIENT_ID,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
      redirectUri: process.env.LINKEDIN_REDIRECT_URI,
    },
    x: {
      clientId: process.env.X_CLIENT_ID,
      clientSecret: process.env.X_CLIENT_SECRET,
      redirectUri: process.env.X_REDIRECT_URI,
    },
  },
  port: Number(process.env.PORT),
  redisUrl: process.env.REDIS_URL,
};
