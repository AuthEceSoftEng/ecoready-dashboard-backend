import express from "express";

import { attachUser } from "../utils/index.js";

import publicRoutes from "./public.js";
import userSystemRoutes from "./user-system.js";
import userRoutes from "./user.js";
import ecoReadyServicesRoutes from "./eco-ready-services.js";
import fileRoutes from "./file.js";

const router = express.Router({ mergeParams: true });

// Handlers for public routes
router.use("/", publicRoutes);

// Handlers for user routes
router.use("/", userSystemRoutes);

// Authorization middleware
router.use(attachUser);

// Handlers for user routes
router.use("/user/", userRoutes);

// Handlers for EcoReady services routes
router.use("/eco-ready-services/", ecoReadyServicesRoutes);

// Handlers for file routes (upload/download)
router.use("/file/", fileRoutes);

router.get("/test/", (req, res) => {
	const { user } = res.locals;
	console.log(user);
	return res.json({ success: true });
});

export default router;
