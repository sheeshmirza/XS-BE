import postService from "../src/services/postService";
import postRepository from "../src/repositories/postRepository";
import aiService from "../src/services/aiService";
import httpStatus from "../src/constants/httpStatus";

jest.mock("../src/repositories/postRepository", () => ({
  __esModule: true,
  default: {
    create: jest.fn(),
    findById: jest.fn(),
    findByIdAndUserId: jest.fn(),
    listByUserId: jest.fn(),
    countByUserId: jest.fn(),
    updateByIdAndUserId: jest.fn(),
    deleteByIdAndUserId: jest.fn(),
    aggregateDashboard: jest.fn(),
    platformStats: jest.fn(),
  },
}));

jest.mock("../src/services/aiService", () => ({
  __esModule: true,
  default: {
    generateText: jest.fn(),
    generateImage: jest.fn(),
  },
}));

jest.mock("../src/services/socialService", () => ({
  __esModule: true,
  default: {
    listHandlesForPlatforms: jest.fn(),
  },
}));

jest.mock("../src/services/notificationService", () => ({
  __esModule: true,
  default: {
    createNotification: jest.fn(),
  },
}));

jest.mock("../src/repositories/socialHandleRepository", () => ({
  __esModule: true,
  default: {
    findByUserAndIds: jest.fn(),
    updateByIdAndUserId: jest.fn(),
  },
}));

jest.mock("../src/adapters/publish", () => ({
  getPublishAdapter: jest.fn(),
}));

jest.mock("../src/queue/postQueue", () => ({
  addSchedulePublishJob: jest.fn(),
}));

const mockedPostRepository = postRepository as jest.Mocked<typeof postRepository>;
const mockedAiService = aiService as jest.Mocked<typeof aiService>;

describe("postService.createPost AI content", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedPostRepository.create.mockImplementation(async (payload: any) => ({
      _id: "post-1",
      ...payload,
    }));
  });

  it("creates a text post using AI-generated caption", async () => {
    mockedAiService.generateText.mockResolvedValue({ text: "AI generated caption" } as any);

    const result = await postService.createPost("user-1", {
      title: "AI draft",
      caption: "",
      selectedPlatforms: ["linkedin"],
      selectedAccountIds: ["acc-1"],
      ai: {
        enabled: true,
        generationType: "text",
        textProvider: "openai",
        textModel: "gpt-5.3-codex",
        textPrompt: "Generate a short launch post",
      },
    });

    expect(mockedAiService.generateText).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: "openai",
        model: "gpt-5.3-codex",
        prompt: "Generate a short launch post",
      }),
    );
    expect(mockedAiService.generateImage).not.toHaveBeenCalled();
    expect(mockedPostRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        caption: "AI generated caption",
        postType: "text",
      }),
    );
    expect(result).toEqual(
      expect.objectContaining({
        caption: "AI generated caption",
      }),
    );
  });

  it("creates an image-only post using AI-generated media", async () => {
    mockedAiService.generateImage.mockResolvedValue({
      images: [{ url: "https://img.example/1.png", mimeType: "image/png" }],
    } as any);

    const result = await postService.createPost("user-2", {
      caption: "",
      selectedPlatforms: ["x"],
      selectedAccountIds: ["acc-2"],
      ai: {
        enabled: true,
        generationType: "image",
        imageProvider: "openai",
        imageModel: "gpt-image-2",
        imagePrompt: "Generate a launch teaser image",
        imageFormat: "url",
      },
    });

    expect(mockedAiService.generateText).not.toHaveBeenCalled();
    expect(mockedAiService.generateImage).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: "openai",
        model: "gpt-image-2",
        prompt: "Generate a launch teaser image",
      }),
    );
    expect(mockedPostRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        postType: "image",
        media: [
          expect.objectContaining({
            type: "image",
            url: "https://img.example/1.png",
          }),
        ],
      }),
    );
    expect(result).toEqual(
      expect.objectContaining({
        postType: "image",
      }),
    );
  });

  it("creates a mixed post using both AI text and AI image", async () => {
    mockedAiService.generateText.mockResolvedValue({ text: "Caption from AI" } as any);
    mockedAiService.generateImage.mockResolvedValue({
      images: [{ url: "https://img.example/mixed.png" }],
    } as any);

    const result = await postService.createPost("user-3", {
      title: "Campaign",
      caption: "",
      ai: {
        enabled: true,
        generationType: "both",
        textProvider: "openai",
        textModel: "gpt-5.3-codex",
        textPrompt: "Write product campaign post",
        imageProvider: "openai",
        imageModel: "gpt-image-2",
        imagePrompt: "Create campaign visual",
      },
    });

    expect(mockedAiService.generateText).toHaveBeenCalledTimes(1);
    expect(mockedAiService.generateImage).toHaveBeenCalledTimes(1);
    expect(mockedPostRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        caption: "Caption from AI",
        postType: "mixed",
      }),
    );
    expect(result).toEqual(
      expect.objectContaining({
        caption: "Caption from AI",
        postType: "mixed",
      }),
    );
  });

  it("rejects when AI text mode is enabled but prompt/config is missing", async () => {
    await expect(
      postService.createPost("user-4", {
        caption: "",
        ai: {
          enabled: true,
          generationType: "text",
          textProvider: "openai",
          textModel: "gpt-5.3-codex",
        },
      }),
    ).rejects.toMatchObject({
      statusCode: httpStatus.BAD_REQUEST,
      message: "AI text generation requires provider, model, and text prompt",
    });
  });
});
