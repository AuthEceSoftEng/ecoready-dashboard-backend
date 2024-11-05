import express from "express";
import Sentry from "@sentry/node";
import dotenv from "dotenv";

import { CollectionDataManagement } from "../utils/index.js";

dotenv.config();
console.log("key", process.env.ACCESS_KEY);
console.log("url", process.env.DATABASE_URL);

const router = express.Router({ mergeParams: true });

// Parse the ACCESS_KEY environment variable as a JSON object
const accessKeys = JSON.parse(process.env.ACCESS_KEY);

router.get("/getdata", async (req, res) => {
	try {
		const { organization, project, collection, params } = req.query;
		const accessKey = accessKeys[organization];
		const response = await CollectionDataManagement.getData(organization, project, collection, accessKey, params);
		return res.json(response);
	} catch (error) {
		Sentry.captureException(error);
		return res.status(500).json({ message: "Something went wrong." });
	}
});

router.get("/getdatastatistics", async (req, res) => {
	try {
		const { organization, project, collection, params } = req.query;
		const accessKey = accessKeys[organization];
		const response = await CollectionDataManagement.getDataStatistics(organization, project, collection, accessKey, params);
		return res.json(response);
	} catch (error) {
		Sentry.captureException(error);
		return res.status(500).json({ message: "Something went wrong." });
	}
});

export default router;
