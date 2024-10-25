import express from "express";
import Sentry from "@sentry/node";

import { CollectionDataManagement } from "../utils/index.js";

const router = express.Router({ mergeParams: true });

router.get("/getdata", async (req, res) => {
	try {
		const { organization, project, collection, accessKey, params } = req.query;
		// console.log('Params in endpoint', params)
		const response = await CollectionDataManagement.getData(organization, project, collection, accessKey, params);
		return res.json(response);
	} catch (error) {
		Sentry.captureException(error);
		return res.status(500).json({ message: "Something went wrong." });
	}
});

router.get("/getdatastatistics", async (req, res) => {
	// const organization = 'living_lab_agro';
	// const project = 'irrigation';
	// const collection = 'sensors_data';
	// const accessKey = '76c8041409329428763ed6b1a7c31cc9e16119b4f57c34d007d644a4fac2b331';
	try {
		const { organization, project, collection, accessKey, params } = req.query;
		const response = await CollectionDataManagement.getDataStatistics(organization, project, collection, accessKey, params);
		return res.json(response);
	} catch (error) {
		Sentry.captureException(error);
		return res.status(500).json({ message: "Something went wrong." });
	}
});

export default router;
