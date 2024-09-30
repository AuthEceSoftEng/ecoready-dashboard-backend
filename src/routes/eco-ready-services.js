import express from "express";
import Sentry from "@sentry/node";

import { CollectionDataManagement } from "../utils/index.js";

const router = express.Router({ mergeParams: true });

router.get("/", async (req, res) => {
	try {
		const { organization, project, collection, accessKey } = req.query;
		const response = await CollectionDataManagement.getData(organization, project, collection, accessKey);
		return res.json(response);
	} catch (error) {
		Sentry.captureException(error);
		return res.status(500).json({ message: "Something went wrong." });
	}
});

export default router;
