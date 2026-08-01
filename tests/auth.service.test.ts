import bcrypt from "bcrypt";

import httpStatus from "../src/constants/httpStatus";
import authService from "../src/services/authService";
import tokenService from "../src/services/tokenService";
import ApiError from "../src/utils/ApiError";
import { randomToken } from "../src/utils/crypto";
import userRepository from "../src/repositories/userRepository";

jest.mock("bcrypt", () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

jest.mock("../src/repositories/userRepository", () => ({
  __esModule: true,
  default: {
    findByEmail: jest.fn(),
    create: jest.fn(),
    findByVerificationToken: jest.fn(),
    updateById: jest.fn(),
    findById: jest.fn(),
    findByResetToken: jest.fn(),
  },
}));

jest.mock("../src/services/tokenService", () => ({
  __esModule: true,
  default: {
    generateAccessToken: jest.fn(),
    generateRefreshToken: jest.fn(),
    rotateRefreshToken: jest.fn(),
    revokeRefreshToken: jest.fn(),
    revokeAllForUser: jest.fn(),
  },
}));

jest.mock("../src/utils/crypto", () => ({
  randomToken: jest.fn(),
}));

const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;
const mockedUserRepository = userRepository as jest.Mocked<typeof userRepository>;
const mockedTokenService = tokenService as jest.Mocked<typeof tokenService>;
const mockedRandomToken = randomToken as jest.Mock;

describe("authService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("signup should reject duplicate email", async () => {
    mockedUserRepository.findByEmail.mockResolvedValue({ _id: "existing" } as any);

    await expect(
      authService.signup({ email: "user@example.com", password: "secret" }),
    ).rejects.toMatchObject({
      statusCode: httpStatus.CONFLICT,
      message: "Email is already registered",
    });
  });

  it("signup should create user with verification token", async () => {
    const createdUser = { _id: "new-user", isVerified: false };

    mockedUserRepository.findByEmail.mockResolvedValue(null as any);
    mockedBcrypt.hash.mockResolvedValue("password-hash" as never);
    mockedRandomToken.mockReturnValue("verification-token");
    mockedUserRepository.create.mockResolvedValue(createdUser as any);

    const result = await authService.signup({
      email: "user@example.com",
      password: "secret",
    });

    expect(result).toBe(createdUser);
    expect(mockedUserRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "user@example.com",
        password: "password-hash",
        isVerified: false,
        emailVerificationToken: "verification-token",
        emailVerificationExpiresAt: expect.any(Date),
      }),
    );
  });

  it("verifyEmail should reject missing user", async () => {
    mockedUserRepository.findByVerificationToken.mockResolvedValue(null as any);

    await expect(authService.verifyEmail("bad-token")).rejects.toMatchObject({
      statusCode: httpStatus.BAD_REQUEST,
      message: "Invalid or expired verification token",
    });
  });

  it("verifyEmail should reject expired token", async () => {
    mockedUserRepository.findByVerificationToken.mockResolvedValue({
      emailVerificationExpiresAt: new Date(Date.now() - 1000),
    } as any);

    await expect(authService.verifyEmail("expired-token")).rejects.toMatchObject({
      statusCode: httpStatus.BAD_REQUEST,
      message: "Invalid or expired verification token",
    });
  });

  it("verifyEmail should update and save user", async () => {
    const user = {
      isVerified: false,
      emailVerificationToken: "token",
      emailVerificationExpiresAt: new Date(Date.now() + 1000),
      save: jest.fn().mockResolvedValue(undefined),
    };

    mockedUserRepository.findByVerificationToken.mockResolvedValue(user as any);

    const result = await authService.verifyEmail("ok-token");

    expect(result).toBe(user);
    expect(user.isVerified).toBe(true);
    expect(user.emailVerificationToken).toBeNull();
    expect(user.emailVerificationExpiresAt).toBeNull();
    expect(user.save).toHaveBeenCalled();
  });

  it("login should reject unknown email", async () => {
    mockedUserRepository.findByEmail.mockResolvedValue(null as any);

    await expect(
      authService.login(
        { email: "user@example.com", password: "secret" },
        { ipAddress: "127.0.0.1", userAgent: "jest" },
      ),
    ).rejects.toMatchObject({
      statusCode: httpStatus.UNAUTHORIZED,
      message: "Invalid credentials",
    });
  });

  it("login should reject wrong password", async () => {
    mockedUserRepository.findByEmail.mockResolvedValue({
      password: "stored-hash",
    } as any);
    mockedBcrypt.compare.mockResolvedValue(false as never);

    await expect(
      authService.login(
        { email: "user@example.com", password: "wrong" },
        { ipAddress: "127.0.0.1", userAgent: "jest" },
      ),
    ).rejects.toMatchObject({
      statusCode: httpStatus.UNAUTHORIZED,
      message: "Invalid credentials",
    });
  });

  it("login should reject unverified users", async () => {
    mockedUserRepository.findByEmail.mockResolvedValue({
      password: "stored-hash",
      isVerified: false,
    } as any);
    mockedBcrypt.compare.mockResolvedValue(true as never);

    await expect(
      authService.login(
        { email: "user@example.com", password: "secret" },
        { ipAddress: "127.0.0.1", userAgent: "jest" },
      ),
    ).rejects.toMatchObject({
      statusCode: httpStatus.FORBIDDEN,
      message: "Please verify your email first",
    });
  });

  it("login should return tokens and update last login", async () => {
    const user = {
      _id: { toString: () => "user-1" },
      password: "stored-hash",
      isVerified: true,
    };

    mockedUserRepository.findByEmail.mockResolvedValue(user as any);
    mockedBcrypt.compare.mockResolvedValue(true as never);
    mockedTokenService.generateAccessToken.mockReturnValue("access-token" as never);
    mockedTokenService.generateRefreshToken.mockResolvedValue("refresh-token" as never);
    mockedUserRepository.updateById.mockResolvedValue(undefined as never);

    const result = await authService.login(
      { email: "user@example.com", password: "secret" },
      { ipAddress: "127.0.0.1", userAgent: "jest" },
    );

    expect(result).toEqual({
      user,
      accessToken: "access-token",
      refreshToken: "refresh-token",
    });
    expect(mockedUserRepository.updateById).toHaveBeenCalledWith(
      user._id,
      expect.objectContaining({ lastLoginAt: expect.any(Date) }),
    );
  });

  it("refresh should reject invalid refresh token", async () => {
    mockedTokenService.rotateRefreshToken.mockResolvedValue(null as any);

    await expect(
      authService.refresh("bad-refresh", {
        ipAddress: "127.0.0.1",
        userAgent: "jest",
      }),
    ).rejects.toMatchObject({
      statusCode: httpStatus.UNAUTHORIZED,
      message: "Invalid refresh token",
    });
  });

  it("refresh should reject unknown user", async () => {
    mockedTokenService.rotateRefreshToken.mockResolvedValue({
      userId: "missing-user",
      accessToken: "a",
      refreshToken: "b",
    } as any);
    mockedUserRepository.findById.mockResolvedValue(null as any);

    await expect(
      authService.refresh("ok-refresh", {
        ipAddress: "127.0.0.1",
        userAgent: "jest",
      }),
    ).rejects.toMatchObject({
      statusCode: httpStatus.UNAUTHORIZED,
      message: "Invalid refresh token user",
    });
  });

  it("refresh should return rotated token pair", async () => {
    const user = { _id: "user-1" };

    mockedTokenService.rotateRefreshToken.mockResolvedValue({
      userId: "user-1",
      accessToken: "access-2",
      refreshToken: "refresh-2",
    } as any);
    mockedUserRepository.findById.mockResolvedValue(user as any);

    const result = await authService.refresh("ok-refresh", {
      ipAddress: "127.0.0.1",
      userAgent: "jest",
    });

    expect(result).toEqual({
      user,
      accessToken: "access-2",
      refreshToken: "refresh-2",
    });
  });

  it("logout should return early without token", async () => {
    await authService.logout(undefined as any);

    expect(mockedTokenService.revokeRefreshToken).not.toHaveBeenCalled();
  });

  it("logout should revoke provided token", async () => {
    mockedTokenService.revokeRefreshToken.mockResolvedValue(undefined as never);

    await authService.logout("refresh-token");

    expect(mockedTokenService.revokeRefreshToken).toHaveBeenCalledWith("refresh-token");
  });

  it("forgotPassword should no-op for unknown email", async () => {
    mockedUserRepository.findByEmail.mockResolvedValue(null as any);

    await authService.forgotPassword("missing@example.com");

    expect(mockedUserRepository.updateById).not.toHaveBeenCalled();
  });

  it("forgotPassword should set reset token and expiry", async () => {
    mockedUserRepository.findByEmail.mockResolvedValue({ _id: "user-1" } as any);
    mockedRandomToken.mockReturnValue("reset-token");
    mockedUserRepository.updateById.mockResolvedValue(undefined as never);

    await authService.forgotPassword("user@example.com");

    expect(mockedUserRepository.updateById).toHaveBeenCalledWith(
      "user-1",
      expect.objectContaining({
        resetPasswordToken: "reset-token",
        resetPasswordExpiresAt: expect.any(Date),
      }),
    );
  });

  it("resetPassword should reject invalid token", async () => {
    mockedUserRepository.findByResetToken.mockResolvedValue(null as any);

    await expect(authService.resetPassword("bad-token", "new-secret")).rejects.toMatchObject({
      statusCode: httpStatus.BAD_REQUEST,
      message: "Invalid or expired reset token",
    });
  });

  it("resetPassword should reject expired token", async () => {
    mockedUserRepository.findByResetToken.mockResolvedValue({
      resetPasswordExpiresAt: new Date(Date.now() - 1000),
    } as any);

    await expect(
      authService.resetPassword("expired-token", "new-secret"),
    ).rejects.toMatchObject({
      statusCode: httpStatus.BAD_REQUEST,
      message: "Invalid or expired reset token",
    });
  });

  it("resetPassword should update password and revoke sessions", async () => {
    mockedUserRepository.findByResetToken.mockResolvedValue({
      _id: "user-1",
      resetPasswordExpiresAt: new Date(Date.now() + 1000),
    } as any);
    mockedBcrypt.hash.mockResolvedValue("new-hash" as never);
    mockedTokenService.revokeAllForUser.mockResolvedValue(undefined as never);
    mockedUserRepository.updateById.mockResolvedValue(undefined as never);

    await authService.resetPassword("valid-token", "new-secret");

    expect(mockedTokenService.revokeAllForUser).toHaveBeenCalledWith("user-1");
    expect(mockedUserRepository.updateById).toHaveBeenCalledWith(
      "user-1",
      {
        password: "new-hash",
        resetPasswordToken: null,
        resetPasswordExpiresAt: null,
      },
    );
  });

  it("throws ApiError instances for error paths", async () => {
    mockedUserRepository.findByEmail.mockResolvedValue({ _id: "existing" } as any);

    try {
      await authService.signup({ email: "user@example.com", password: "secret" });
      throw new Error("Expected conflict error");
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
    }
  });
});
