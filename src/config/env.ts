//Reviewed

import dotenv from "dotenv";

dotenv.config();

const cleanEnvValue = (value?: string) => {
  if (!value) {
    return value;
  }
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
};

export default {
  bcryptSaltRounds: Number(process.env.BCRYPT_SALT_ROUNDS),
  clientUrl: cleanEnvValue(process.env.CLIENT_URL),
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN,
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET,
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
  mongodbDbName: process.env.MONGODB_DB_NAME,
  mongodbUri: process.env.MONGODB_URI,
  oauth: {
    facebook: {
      clientId: cleanEnvValue(process.env.FACEBOOK_CLIENT_ID),
      clientSecret: cleanEnvValue(process.env.FACEBOOK_CLIENT_SECRET),
      redirectUri: cleanEnvValue(process.env.FACEBOOK_REDIRECT_URI),
    },
    instagram: {
      clientId: cleanEnvValue(process.env.INSTAGRAM_CLIENT_ID),
      clientSecret: cleanEnvValue(process.env.INSTAGRAM_CLIENT_SECRET),
      redirectUri: cleanEnvValue(process.env.INSTAGRAM_REDIRECT_URI),
    },
    linkedin: {
      clientId: cleanEnvValue(process.env.LINKEDIN_CLIENT_ID),
      clientSecret: cleanEnvValue(process.env.LINKEDIN_CLIENT_SECRET),
      redirectUri: cleanEnvValue(process.env.LINKEDIN_REDIRECT_URI),
    },
    x: {
      clientId: cleanEnvValue(process.env.X_CLIENT_ID),
      clientSecret: cleanEnvValue(process.env.X_CLIENT_SECRET),
      redirectUri: cleanEnvValue(process.env.X_REDIRECT_URI),
    },
  },
  port: Number(process.env.PORT),
  redisUrl: process.env.REDIS_URL,
};
