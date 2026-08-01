import axios from "axios";
import BasePublishAdapter from "./basePublishAdapter";

class YouTubePublishAdapter extends BasePublishAdapter {
  mapPrivacyStatus(visibility) {
    const normalized = String(visibility || "public").toLowerCase();
    if (normalized === "private") {
      return "private";
    }
    if (normalized === "unlisted") {
      return "unlisted";
    }
    return "public";
  }

  async publish(post, handle) {
    try {
      const token = String(handle.platformAccessToken || "").trim();
      const mediaList = Array.isArray(post?.media) ? post.media : [];
      const video = mediaList.find(
        (item) => String(item?.type || "").toLowerCase() === "video" && item?.url,
      );

      if (!token) {
        return {
          status: "failed",
          message: "YouTube access token is missing",
          raw: {},
        };
      }

      if (!video?.url) {
        return {
          status: "failed",
          message: "YouTube publishing requires a video media URL",
          raw: {},
        };
      }

      const videoResponse = await axios.get(video.url, {
        responseType: "arraybuffer",
      });

      const binaryBody = videoResponse.data;
      const contentType = video.mimeType || videoResponse.headers["content-type"] || "video/mp4";
      const contentLength = Number(videoResponse.headers["content-length"] || binaryBody?.byteLength || 0);

      const title = String(post?.title || "").trim() || "Untitled Video";
      const description = String(post?.caption || "").trim();
      const privacyStatus = this.mapPrivacyStatus(post?.visibility);

      const initResumableUpload = await axios.post(
        "https://www.googleapis.com/upload/youtube/v3/videos",
        {
          snippet: {
            title,
            description,
          },
          status: {
            privacyStatus,
          },
        },
        {
          params: {
            part: "snippet,status",
            uploadType: "resumable",
          },
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json; charset=UTF-8",
            "X-Upload-Content-Type": contentType,
            "X-Upload-Content-Length": String(contentLength),
          },
        },
      );

      const uploadUrl = initResumableUpload.headers?.location;
      if (!uploadUrl) {
        return {
          status: "failed",
          message: "YouTube resumable upload URL was not returned",
          raw: initResumableUpload.data || {},
        };
      }

      const uploadRes = await axios.put(uploadUrl, binaryBody, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": contentType,
        },
      });

      const videoId = uploadRes?.data?.id || "";

      return {
        status: "success",
        platformPostId: videoId,
        url: videoId ? `https://www.youtube.com/watch?v=${videoId}` : "",
        raw: uploadRes?.data || {},
      };
    } catch (error) {
      return {
        status: "failed",
        message: error?.message || "YouTube publish failed",
        raw: error?.response?.data || {},
      };
    }
  }
}

export default YouTubePublishAdapter;
