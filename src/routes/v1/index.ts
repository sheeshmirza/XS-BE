//Reviewed

import express from "express";

import authRoutes from "./authRoutes";
import dashboardRoutes from "./dashboardRoutes";
import notificationRoutes from "./notificationRoutes";
import postRoutes from "./postRoutes";
import socialRoutes from "./socialRoutes";
import uploadRoutes from "./uploadRoutes";
import userRoutes from "./userRoutes";

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/notifications", notificationRoutes);
router.use("/posts", postRoutes);
router.use("/social", socialRoutes);
router.use("/uploads", uploadRoutes);
router.use("/users", userRoutes);

export default router;
