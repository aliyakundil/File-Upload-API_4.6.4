import express from "express";
import { Router } from "express";
import type { Response, Request } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import { registerUser } from "../services/registrationService.js";
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  patchUser,
  deleteUser
} from "../services/userSevices.js";
import { authenticateToken, requireRole, type AuthJwtPayload } from "../middlewares/auth.js";
import { getLoginPage, getRegisterPage } from "../controllers/uploadController.js";

const router = Router();

dotenv.config();

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;

router.get('/login', getLoginPage);
router.get('/register', getRegisterPage);

router.post("/auth/register", async (req, res) => {
  const { email, password, username, profile } = req.body;

  if (!email || !password || !username) {
    return res.status(400).send({ error: "Missing required fields" });
  }

  try {
    const user = await registerUser(req.body);
    
    if (!user) {
        return res.status(400).json({ error: "User registration failed" });
    }

    res.status(201).json({ 
        username: username,
        email: email 
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/auth/verify-email", async (req, res) => {
  const token = req.query.token as string;

  if (!token || typeof token !== "string") {
    return res.status(400).json({ message: "Token is required" });
  }

  const user = await User.findOne({
    emailVerificationToken: token,
  });

  if (!user) {
    return res.status(400).json({ message: "Invalid token" });
  }

  user.isEmailVerified = true;
  user.emailVerificationToken = null;
  await user.save();

  res.send("Email verified successfully");
});

router.post("/auth/resend-verification", async (req, res) => {
  const { email } = req.body;

  const userEmail = await User.findOne({
    email: email,
  });
  if (!userEmail) {
    return res.status(404).json({ message: "User not found" });
  }

  const payload = { userId: userEmail._id };

  const accessToken = jwt.sign(payload, ACCESS_TOKEN_SECRET!, {
    expiresIn: "15m",
  }); // уникальный токен
  const refreshToken = jwt.sign(payload, REFRESH_TOKEN_SECRET!, {
    expiresIn: "7d",
  });

  userEmail.refreshToken.push(refreshToken);

  res.json({
    message: "Verification tokens generated",
    accessToken,
    refreshToken,
  });
});

function generateAccessToken(payload: { userId: string; role: string, username: string }) {
  return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET!, {
    expiresIn: "60s",
  });
}

router.post("/auth/login", async (req: Request, res: Response) => {
  const { username, email, password } = req.body;

  const user = await User.findOne({ $or: [{ email }, { username }] }).select(
    "+password",
  );

  if (!user) {
    return res.status(401).json({ msg: "Invalid credentials" });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const payload = {
    userId: user._id.toString(),
    role: user.role,
    username: user.username
  };

  const accessToken = generateAccessToken(payload);
  const refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET!);

  user.refreshToken.push(refreshToken);

  await user.save();

  res.json({ accessToken, refreshToken });
});

router.post("/auth/token", async (req: Request, res: Response) => {
  const refreshToken = req.body.token;
  const user = await User.findOne({ refreshToken });
  if (!user) return res.sendStatus(403);
  if (!refreshToken) return res.sendStatus(401);
  if (!user.refreshToken.includes(refreshToken)) return res.sendStatus(403);

  jwt.verify(
    refreshToken,
    process.env.REFRESH_TOKEN_SECRET!,
    (err: any, decoded: any) => {
      if (err) return res.sendStatus(403);

      const payload = {
        userId: decoded.userId,
        role: decoded.role,
        username: decoded.username
      };

      const newAccessToken = generateAccessToken(payload);
      res.json({ accessToken: newAccessToken });
    },
  );
});

router.post("/auth/refresh", async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.sendStatus(401);

  let decode;
  try {
    decode = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET!) as {
      userId: string;
      role: string;
    };
  } catch (err) {
    return res.sendStatus(401);
  }

  const user = await User.findById(decode.userId);
  if (!user) return res.sendStatus(403);

  if (!user.refreshToken.includes(refreshToken)) return res.sendStatus(403);

  const payload = {
    userId: user._id.toString(),
    role: user.role,
    username: user.username
  };

  // удалить старый refreshToken
  user.refreshToken = user.refreshToken.filter((f) => f !== refreshToken);

  const newRefreshToken = jwt.sign(payload, REFRESH_TOKEN_SECRET!, {
    expiresIn: "7d",
  });

  const accessToken = generateAccessToken(payload);
  user.refreshToken.push(newRefreshToken);

  await user.save();

  res.status(200).json({
    accessToken: accessToken,
    refreshToken: newRefreshToken,
  });
});

router.post("/auth/logout", async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.sendStatus(401);
  const user = await User.findOne({ refreshToken: { $in: [refreshToken] } });
  if (!user) return res.sendStatus(403);
  user.refreshToken = user.refreshToken.filter((f) => f !== refreshToken);
  await user.save();
  return res.sendStatus(204);
});

// ===== Приватные маршруты для любого авторизованного пользователя =====
router.get("/me", authenticateToken, async (req, res) => {
  const userId = (req.user as AuthJwtPayload).userId;
  const user = await User.findById(userId).select("-password -refreshTokens");
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json(user);
});

router.patch("/me", authenticateToken, async (req, res) => {
  const userId = (req.user as AuthJwtPayload).userId;
  const body = req.body;

  if (!body.profile)
    return res.status(400).json({ error: "Profile data required" });

  const userUpdate = await patchUser(userId, body);
  res.json(userUpdate);
});

// ===== Админские =====
router.get(
  "/admin/users",
  authenticateToken,
  requireRole("admin"),
  async (req, res, next) => {
    try {
      const user = await getUsers(req.query);
      res.status(200).json({ success: true, data: user });
    } catch (err) {
      next(err);
    }
  },
);

router.get(
  "/admin/users/:id",
  authenticateToken,
  requireRole("admin"),
  async (req, res, next) => {
    try {
      const id = req.params.id;

      if (!id) {
        return res.status(404).json({
          success: false,
          error: "User not found",
        });
      }

      if (!id || Array.isArray(id)) {
        return res
          .status(400)
          .json({ success: false, error: "Invalid user id" });
      }

      const result = await getUserById(id);

      if (!result) {
        return res.status(404).json({
          success: false,
          error: "Invalid user id",
        });
      }

      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },
);

router.post(
  "/admin/users",
  authenticateToken,
  requireRole("admin"),
  async (req, res, next) => {
    try {
      const result = await createUser(req.body);
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },
);

router.put(
  "/admin/users/:id",
  authenticateToken,
  requireRole("admin"),
  async (req, res, next) => {
    try {
      const id = req.params.id;

      if (!id || Array.isArray(id)) {
        return res
          .status(400)
          .json({ success: false, error: "Invalid user id" });
      }

      const result = await updateUser(id, req.body);

      if (!result) {
        return res.status(404).json({
          success: false,
          error: "User not found",
        });
      }

      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },
);

router.patch(
  "/admin/users/:id",
  authenticateToken,
  requireRole("admin"),
  async (req, res, next) => {
    try {
      const id = req.params.id;

      const body = req.body;

      if (!body || Object.keys(body).length === 0) {
        const err = new Error("Body не может быть пустым");
        (err as any).status = 400;
        return next(err);
      }

      if (!id || Array.isArray(id)) {
        return res
          .status(400)
          .json({ success: false, error: "Invalid user id" });
      }

      const result = await patchUser(id, req.body);

      if (!result) {
        const err = new Error("Not Found");
        (err as any).status = 400;
        return next(err);
      }

      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },
);

router.delete(
  "/admin/users/:id",
  authenticateToken,
  requireRole("admin"),
  async (req, res, next) => {
    try {
      const id = req.params.id;

      if (!id || Array.isArray(id)) {
        return res
          .status(400)
          .json({ success: false, error: "Invalid user id" });
      }

      const deleted = await deleteUser(id);

      if (!deleted) {
        const err = new Error("User not found");
        (err as any).status = 404;
        return next(err);
      }

      return res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
)

export default router;