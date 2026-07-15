import axios from "axios";
import BasePublishAdapter from "./basePublishAdapter";

class LinkedInPublishAdapter extends BasePublishAdapter {
  async publish(post, handle) {
    try {
      const caption = `${post.caption || ""}`.trim();
      if (!caption) {
        return {
          status: "failed",
          message: "Post caption is required for LinkedIn publishing",
          raw: {},
        };
      }

      const accountType = handle?.metadata?.accountType || "personal";
      const isOrganization = accountType === "organization";
      const organizationUrn = handle?.metadata?.organizationUrn
        ? String(handle.metadata.organizationUrn)
        : `urn:li:organization:${handle.platformUserId}`;
      const personUrn = `urn:li:person:${handle.platformUserId}`;
      const authorUrn = isOrganization ? organizationUrn : personUrn;

      const payload = {
        author: authorUrn,
        lifecycleState: "PUBLISHED",
        specificContent: {
          "com.linkedin.ugc.ShareContent": {
            shareCommentary: {
              text: caption,
            },
            shareMediaCategory: "NONE",
          },
        },
        visibility: {
          "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
        },
      };
      const response = await axios.post(
        "https://api.linkedin.com/v2/ugcPosts",
        payload,
        {
          headers: {
            Authorization: `Bearer ${handle.platformAccessToken}`,
            "Content-Type": "application/json",
            "X-Restli-Protocol-Version": "2.0.0",
            "LinkedIn-Version": "202405",
          },
        },
      );
      return {
        status: "success",
        platformPostId:
          response.headers?.["x-restli-id"] || response.data?.id || "",
        url: "",
        raw: response.data || {},
      };
    } catch (error) {
      const rawPayload = error?.response?.data;
      const normalizedRaw =
        rawPayload && typeof rawPayload === "object"
          ? {
              ...rawPayload,
              status: rawPayload?.status || error?.response?.status || 0,
              code: rawPayload?.code || "",
            }
          : {
              status: error?.response?.status || 0,
              code: "",
              message: error?.message || "LinkedIn publish failed",
            };
      return {
        status: "failed",
        message:
          normalizedRaw?.message || error?.message || "LinkedIn publish failed",
        raw: normalizedRaw,
      };
    }
  }
}

export default LinkedInPublishAdapter;
