import express from "express";
import Sentry from "@sentry/node";
import dotenv from "dotenv";

import { CollectionManagement, CollectionDataManagement } from "../utils/index.js";

dotenv.config();

const router = express.Router({ mergeParams: true });

// Parse the ACCESS_KEY environment variable as a JSON object
// const accessKeys = JSON.parse(process.env.ACCESS_KEY);
const universalAccessKey = process.env.UNIVERSAL_ACCESS_KEY;

router.get("/getcollections", async (req, res) => {
	try {
		const { organization, project } = req.query;
		const accessKey = universalAccessKey;
		const response = await CollectionManagement.getCollections(organization, project, accessKey);
		return res.json(response);
	} catch (error) {
		Sentry.captureException(error);
		return res.status(500).json({ message: "Something went wrong." });
	}
});

router.get("/getdata", async (req, res) => {
	try {
		const { organization, project, collection, params } = req.query;
		const accessKey = universalAccessKey;
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
		const accessKey = universalAccessKey;
		const response = await CollectionDataManagement.getDataStatistics(organization, project, collection, accessKey, params);
		return res.json(response);
	} catch (error) {
		Sentry.captureException(error);
		return res.status(500).json({ message: "Something went wrong." });
	}
});

export default router;
