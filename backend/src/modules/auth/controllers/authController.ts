import { Request, Response } from "express";
import { authService } from "../services/authService.js";
import { catchAsync } from "../../../core/utils/catchAsync.js";
import { apiResponse } from "../../../core/utils/apiResponse.js";
import { AuthRequest, setAuthCookies, clearAuthCookies, signAccessToken, signRefreshToken, verifyRefreshToken, revokeRefreshToken, revokeAllUserTokens } from "../../../middleware/auth.js";
import { setCsrfCookie } from "../../../middleware/security.js";
import { AuthenticationError } from "../../../core/errors/AppError.js";

export const authController = {
  register: catchAsync(async (req: Request, res: Response) => {
    const result = await authService.register(req.body);
    apiResponse.created(res, result, req.requestId);
  }),

  login: catchAsync(async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const result = await authService.login(email, password, req.ip ?? "", req.headers["user-agent"] ?? "");
    if ("requiresTwoFactor" in result) {
      return apiResponse.success(res, { requiresTwoFactor: true, tempToken: result.tempToken }, 200, req.requestId);
    }
    const { user } = result;
    const accessToken = signAccessToken({ userId: user.id, email: user.email, organizationId: user.organizationId || "", workspaceId: user.workspaceId || null, role: user.role });
    const refreshToken = await signRefreshToken({ userId: user.id, email: user.email, organizationId: user.organizationId || "", workspaceId: user.workspaceId || null, role: user.role }, req);
    setAuthCookies(res, { accessToken, refreshToken });
    setCsrfCookie(req, res);
    apiResponse.success(res, { user }, 200, req.requestId);
  }),

  refresh: catchAsync(async (req: Request, res: Response) => {
    const token = req.cookies?.refresh_token || req.body?.refreshToken;
    if (!token) throw new AuthenticationError("Refresh token required");
    const { payload, tokenId } = await verifyRefreshToken(token);
    await revokeRefreshToken(tokenId);
    const accessToken = signAccessToken(payload);
    const refreshToken = await signRefreshToken(payload, req);
    setAuthCookies(res, { accessToken, refreshToken });
    apiResponse.success(res, { message: "Token refreshed" }, 200, req.requestId);
  }),

  logout: catchAsync(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    if (req.body?.all && authReq.user) {
      await revokeAllUserTokens(authReq.user.userId);
    } else {
      const token = req.cookies?.refresh_token || req.body?.refreshToken;
      if (token) {
        try {
          const jwt = await import("jsonwebtoken");
          const decoded = jwt.decode(token) as { tokenId?: string } | null;
          if (decoded?.tokenId) await revokeRefreshToken(decoded.tokenId);
        } catch { /* ignore */ }
      }
    }
    clearAuthCookies(res);
    res.clearCookie("csrf_token", { path: "/" });
    apiResponse.success(res, { message: "Logged out" }, 200, req.requestId);
  }),

  me: catchAsync(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const result = await authService.getMe(authReq.user!.userId);
    apiResponse.success(res, result, 200, req.requestId);
  }),

  changePassword: catchAsync(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const { currentPassword, newPassword } = req.body;
    await authService.changePassword(authReq.user!.userId, currentPassword, newPassword);
    apiResponse.success(res, { message: "Password changed" }, 200, req.requestId);
  }),

  forgotPassword: catchAsync(async (req: Request, res: Response) => {
    await authService.forgotPassword(req.body.email);
    apiResponse.success(res, { message: "If email exists, reset link sent" }, 200, req.requestId);
  }),

  resetPassword: catchAsync(async (req: Request, res: Response) => {
    const { email, token, newPassword } = req.body;
    await authService.resetPassword(email, token, newPassword);
    apiResponse.success(res, { message: "Password reset successful" }, 200, req.requestId);
  }),

  setup2FA: catchAsync(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const result = await authService.setup2FA(authReq.user!.userId);
    apiResponse.success(res, result, 200, req.requestId);
  }),

  verify2FA: catchAsync(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const { token } = req.body;
    const result = await authService.verifyAndEnable2FA(authReq.user!.userId, token);
    apiResponse.success(res, result, 200, req.requestId);
  }),

  disable2FA: catchAsync(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const { password } = req.body;
    const result = await authService.disable2FA(authReq.user!.userId, password);
    apiResponse.success(res, result, 200, req.requestId);
  }),

  csrfToken: (req: Request, res: Response) => {
    setCsrfCookie(req, res);
    apiResponse.success(res, { message: "CSRF token set" }, 200, req.requestId);
  },
};
