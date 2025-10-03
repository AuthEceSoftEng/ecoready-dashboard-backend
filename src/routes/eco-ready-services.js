import express from "express";
import Sentry from "@sentry/node";
import dotenv from "dotenv";

import { CollectionManagement, CollectionDataManagement } from "../utils/index.js";

dotenv.config();

const router = express.Router({ mergeParams: true });

// Parse the ACCESS_KEY environment variable as a JSON object
const universalAccessKey = process.env.UNIVERSAL_ACCESS_KEY;

/**
 * @swagger
 * /eco-ready-services/getcollections:
 *   get:
 *     tags:
 *       - Collections
 *     summary: Retrieve a list of collections
 *     description: Fetches all collections for a given organization and project.
 *     parameters:
 *       - in: query
 *         name: organization
 *         required: true
 *         schema:
 *           type: string
 *         description: The organization name.
 *       - in: query
 *         name: project
 *         required: true
 *         schema:
 *           type: string
 *         description: The project name.
 *     responses:
 *       200:
 *         description: A list of collections.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     example: "collection123"
 *                   name:
 *                     type: string
 *                     example: "My Collection"
 *                   description:
 *                     type: string
 *                     example: "Description of the collection"
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Something went wrong."
 */
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

/**
 * @swagger
 * /eco-ready-services/getdata:
 *   get:
 *     tags:
 *       - Data
 *     summary: Retrieve data from a collection
 *     description: Fetches data from a specified collection within an organization and project.
 *     parameters:
 *       - in: query
 *         name: organization
 *         required: true
 *         schema:
 *           type: string
 *         description: The organization name.
 *       - in: query
 *         name: project
 *         required: true
 *         schema:
 *           type: string
 *         description: The project name.
 *       - in: query
 *         name: collection
 *         required: true
 *         schema:
 *           type: string
 *         description: The name of the collection.
 *       - in: query
 *         name: params
 *         required: false
 *         schema:
 *           type: string
 *         description: Additional query parameters for filtering data.
 *     responses:
 *       200:
 *         description: Data from the specified collection.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 items:
 *                   type: array
 *                   items:
 *                     type: object
 *                   example: [{ id: "1", name: "Data Item 1" }]
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Something went wrong."
 */
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

/**
 * @swagger
 * /eco-ready-services/getdatastatistics:
 *   get:
 *     tags:
 *       - Data
 *     summary: Retrieve data statistics from a collection
 *     description: Fetches statistical data from a specified collection within an organization and project.
 *     parameters:
 *       - in: query
 *         name: organization
 *         required: true
 *         schema:
 *           type: string
 *         description: The organization name.
 *       - in: query
 *         name: project
 *         required: true
 *         schema:
 *           type: string
 *         description: The project name.
 *       - in: query
 *         name: collection
 *         required: true
 *         schema:
 *           type: string
 *         description: The name of the collection.
 *       - in: query
 *         name: params
 *         required: false
 *         schema:
 *           type: string
 *         description: Additional query parameters for filtering data statistics.
 *     responses:
 *       200:
 *         description: Statistical data from the specified collection.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statistics:
 *                   type: object
 *                   example: { totalItems: 100, avgValue: 50.5 }
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Something went wrong."
 */
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
