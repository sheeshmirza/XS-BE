export enum FacebookAccountType {
  PAGE = "page",
}

export enum InstagramAccountType {
  BUSINESS = "business",
  CREATOR = "creator",
}

export enum LinkedInAccountType {
  ORGANIZATION = "organization",
  PERSON = "person",
}

export enum XAccountType {
  USER = "user",
}

export const normalizedProfileAccountTypeByPlatform = {
  facebook: FacebookAccountType.PAGE,
  instagram: InstagramAccountType.CREATOR,
  linkedin: LinkedInAccountType.PERSON,
  x: XAccountType.USER,
} as const;

export const isLinkedInOrganizationAccountType = (accountType?: string) => {
  return String(accountType || "").trim().toLowerCase() === LinkedInAccountType.ORGANIZATION;
};

export const normalizeAccountTypeByPlatform = (
  platform?: string,
  accountType?: string,
) => {
  const normalizedPlatform = String(platform || "").trim().toLowerCase();
  const normalizedType = String(accountType || "").trim().toLowerCase();
  if (normalizedPlatform === "facebook") {
    return FacebookAccountType.PAGE;
  }
  if (normalizedPlatform === "instagram") {
    return normalizedType === InstagramAccountType.BUSINESS
      ? InstagramAccountType.BUSINESS
      : InstagramAccountType.CREATOR;
  }
  if (normalizedPlatform === "linkedin") {
    return normalizedType === LinkedInAccountType.ORGANIZATION
      ? LinkedInAccountType.ORGANIZATION
      : LinkedInAccountType.PERSON;
  }
  if (normalizedPlatform === "x") {
    return XAccountType.USER;
  }
  return normalizedType;
};
