import express from "express";
import jwt from "jsonwebtoken";
import request from "supertest";

import authController from "../src/controllers/authController";
import errorHandler from "../src/middleware/errorHandler";
import authRoutes from "../src/routes/v1/authRoutes";
import authService from "../src/services/authService";
import userService from "../src/services/userService";

jest.mock("../src/services/authService", () => ({
  __esModule: true,
  default: {
    signup: jest.fn(),
    verifyEmail: jest.fn(),
    login: jest.fn(),
    refresh: jest.fn(),
    logout: jest.fn(),
    forgotPassword: jest.fn(),
    resetPassword: jest.fn(),
  },
}));

jest.mock("jsonwebtoken", () => ({
  verify: jest.fn(),
}));

jest.mock("../src/services/userService", () => ({
  __esModule: true,
  default: {
    getUserById: jest.fn(),
  },
}));

const app = express();
app.use(express.json());
app.use("/api/v1/auth", authRoutes);
app.use(errorHandler);

const mockedAuthService = authService as jest.Mocked<typeof authService>;
const mockedJwtVerify = jwt.verify as jest.Mock;
const mockedUserService = userService as jest.Mocked<typeof userService>;

describe("auth routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("exports a default controller object", () => {
    expect(authController).toBeDefined();
    expect(typeof authController.login).toBe("function");
  });

  it("POST /signup should create user", async () => {
    mockedAuthService.signup.mockResolvedValue({ _id: "user-1", isVerified: false } as any);

    const response = await request(app)
      .post("/api/v1/auth/signup")
      .send({ email: "user@example.com", password: "secret" });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      success: true,
      message: "Signup successful. Verify your email.",
      data: {
        id: "user-1",
        isVerified: false,
      },
    });
    expect(mockedAuthService.signup).toHaveBeenCalledWith({
      email: "user@example.com",
      password: "secret",
    });
  });

  it("POST /signup should validate payload", async () => {
    const response = await request(app)
      .post("/api/v1/auth/signup")
      .send({ email: "bad-email" });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Validation failed");
  });

  it("POST /verify-email should verify token", async () => {
    mockedAuthService.verifyEmail.mockResolvedValue(undefined);

    const response = await request(app)
      .post("/api/v1/auth/verify-email")
      .send({ token: "verify-token" });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      message: "Email verified successfully",
    });
    expect(mockedAuthService.verifyEmail).toHaveBeenCalledWith("verify-token");
  });

  it("POST /login should return tokens", async () => {
    mockedAuthService.login.mockResolvedValue({
      user: { _id: "user-2", isVerified: true },
      accessToken: "access-token",
      refreshToken: "refresh-token",
    } as any);

    const response = await request(app)
      .post("/api/v1/auth/login")
      .set("User-Agent", "jest-agent")
      .send({ email: "user@example.com", password: "secret" });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      message: "Login successful",
      data: {
        tokens: {
          accessToken: "access-token",
          refreshToken: "refresh-token",
        },
        user: {
          id: "user-2",
          isVerified: true,
        },
      },
    });
    expect(mockedAuthService.login).toHaveBeenCalledWith(
      { email: "user@example.com", password: "secret" },
      expect.objectContaining({
        ipAddress: expect.any(String),
        userAgent: "jest-agent",
      }),
    );
  });

  it("POST /refresh should rotate tokens", async () => {
    mockedAuthService.refresh.mockResolvedValue({
      user: { _id: "user-3", isVerified: true },
      accessToken: "next-access",
      refreshToken: "next-refresh",
    } as any);

    const response = await request(app)
      .post("/api/v1/auth/refresh")
      .set("User-Agent", "jest-agent")
      .send({ refreshToken: "raw-refresh" });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      message: "Token refreshed",
      data: {
        tokens: {
          accessToken: "next-access",
          refreshToken: "next-refresh",
        },
        user: {
          id: "user-3",
          isVerified: true,
        },
      },
    });
    expect(mockedAuthService.refresh).toHaveBeenCalledWith(
      "raw-refresh",
      expect.objectContaining({
        ipAddress: expect.any(String),
        userAgent: "jest-agent",
      }),
    );
  });

  it("POST /logout should reject requests without bearer token", async () => {
    const response = await request(app)
      .post("/api/v1/auth/logout")
      .send({ refreshToken: "raw-refresh" });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Missing or invalid Authorization header");
    expect(mockedAuthService.logout).not.toHaveBeenCalled();
  });

  it("POST /logout should reject invalid bearer token", async () => {
    mockedJwtVerify.mockImplementation(() => {
      throw new Error("invalid token");
    });

    const response = await request(app)
      .post("/api/v1/auth/logout")
      .set("Authorization", "Bearer invalid-token")
      .send({ refreshToken: "raw-refresh" });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Invalid or expired token");
    expect(mockedAuthService.logout).not.toHaveBeenCalled();
  });

  it("POST /logout should reject valid token with unknown user", async () => {
    mockedJwtVerify.mockReturnValue({ sub: "user-404" });
    mockedUserService.getUserById.mockResolvedValue(null as any);

    const response = await request(app)
      .post("/api/v1/auth/logout")
      .set("Authorization", "Bearer maybe-valid")
      .send({ refreshToken: "raw-refresh" });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Invalid token user");
    expect(mockedAuthService.logout).not.toHaveBeenCalled();
  });

  it("POST /logout should revoke refresh token", async () => {
    mockedJwtVerify.mockReturnValue({ sub: "user-1" });
    mockedUserService.getUserById.mockResolvedValue({ _id: "user-1" } as any);
    mockedAuthService.logout.mockResolvedValue(undefined);

    const response = await request(app)
      .post("/api/v1/auth/logout")
      .set("Authorization", "Bearer valid-token")
      .send({ refreshToken: "raw-refresh" });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      message: "Logout successful",
    });
    expect(mockedAuthService.logout).toHaveBeenCalledWith("raw-refresh", "user-1");
  });

  it("POST /forgot-password should always return success", async () => {
    mockedAuthService.forgotPassword.mockResolvedValue(undefined);

    const response = await request(app)
      .post("/api/v1/auth/forgot-password")
      .send({ email: "user@example.com" });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      message: "If the email exists, reset instructions were sent",
    });
    expect(mockedAuthService.forgotPassword).toHaveBeenCalledWith("user@example.com");
  });

  it("POST /reset-password should reset credentials", async () => {
    mockedAuthService.resetPassword.mockResolvedValue(undefined);

    const response = await request(app)
      .post("/api/v1/auth/reset-password")
      .send({ token: "reset-token", newPassword: "new-secret" });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      message: "Password reset successful",
    });
    expect(mockedAuthService.resetPassword).toHaveBeenCalledWith(
      "reset-token",
      "new-secret",
    );
  });
});
