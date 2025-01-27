import path from "node:path";
import fs from "node:fs";
import url from "node:url";

import express from "express";
import Sentry from "@sentry/node";
import multer from "multer";

// import { Project, Company } from "../models/index.js";

const uploadFolderPath = path.join(path.dirname(url.fileURLToPath(import.meta.url)), "..", "assets/uploads");

// Initialize storage that stores the uploaded documents
const storage = multer.diskStorage({
	// Set destination to uploads folder
	destination: (req, _file, cb) => {
		cb(null, uploadFolderPath);
	},
	/*
		Replace special characters in filenames
		and add the date
	*/
	filename: (req, file, cb) => {
		const { folder } = req.body; // Get project id from query to create the appropriate folder

		req.body.originalName = file.originalname;

		let name = file.originalname;
		name = name.replaceAll(/\s/g, ""); // Replace the special characters

		const saveName = `${Date.now()}-${name}`;

		req.body.saveName = saveName;

		// Create the folder with the project id if it does not exist
		try {
			fs.mkdirSync(path.join(uploadFolderPath, folder));
		} catch { /* empty */ }

		cb(null, path.join(folder, saveName));
	},
});

/*
	Create the upload middleware that
	accepts a file and stores it
	into the storage
*/
const upload = multer({
	storage,
	fileFilter: (req, _, cb) => cb(null, true),
}).fields([
	{ name: "file", maxCount: 1 },
]);

const router = express.Router({ mergeParams: true });

/*
	Delete a file from server
*/
/**
 * @swagger
 * /file/delete:
 *   post:
 *     tags:
 *       - Files
 *     summary: Delete a file
 *     description: Deletes a file from the server and removes its parent folder if it is empty.
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               folder:
 *                 type: string
 *                 example: "project123"
 *               saveName:
 *                 type: string
 *                 example: "1693069163123-myfile.txt"
 *     responses:
 *       200:
 *         description: File deleted successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
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
router.post("/delete/", (req, res) => {
	try {
		const { folder, saveName } = req.body;

		fs.unlinkSync(path.join(uploadFolderPath, folder, saveName));

		const files = fs.readdirSync(path.join(uploadFolderPath, folder));
		if (!files?.length) {
			fs.rmdirSync(path.join(uploadFolderPath, folder));
		}

		return res.json({ success: true });
	} catch (error) {
		Sentry.captureException(error);
		return res.status(500).json({ message: "Something went wrong." });
	}
});

/*
	Upload a file to server and
	handle the appropriate info
*/
/**
 * @swagger
 * /file/:
 *   post:
 *     tags:
 *       - Files
 *     summary: Upload a file
 *     description: Uploads a file to the server and stores relevant file information.
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               folder:
 *                 type: string
 *                 example: "project123"
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: File uploaded successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 originalName:
 *                   type: string
 *                   example: "myfile.txt"
 *                 saveName:
 *                   type: string
 *                   example: "1693069163123-myfile.txt"
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
router.post("/", upload, (req, res) => {
	try {
		const { folder, originalName, saveName } = req.body;

		console.log("File saved!");
		console.log(`Folder: ${folder}`);
		console.log(`Original name: ${originalName}`);
		console.log(`Save name: ${saveName}`);

		return res.json({ success: true, originalName, saveName });
	} catch (error) {
		Sentry.captureException(error);
		return res.status(500).json({ message: "Something went wrong." });
	}
});

/*
	Re-upload a file to server,
	remove the old one and
	handle the appropriate info
*/
/**
 * @swagger
 * /file/:
 *   put:
 *     tags:
 *       - Files
 *     summary: Re-upload a file
 *     description: Replaces an existing file with a new one and removes the old file.
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               folder:
 *                 type: string
 *                 example: "project123"
 *               oldFile:
 *                 type: string
 *                 example: "1693069163123-myfile.txt"
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: File replaced successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 originalName:
 *                   type: string
 *                   example: "newfile.txt"
 *                 saveName:
 *                   type: string
 *                   example: "1693069200000-newfile.txt"
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
router.put("/", upload, (req, res) => {
	try {
		const { oldFile, folder, originalName, saveName } = req.body;

		fs.unlinkSync(path.join(uploadFolderPath, folder, oldFile.replaceAll("/", path.sep).replaceAll("\\", path.sep)));

		console.log(`Old file "${oldFile}" removed!`);
		console.log("New file saved!");
		console.log(`Folder: ${folder}`);
		console.log(`Original name: ${originalName}`);
		console.log(`Save name: ${saveName}`);

		return res.json({ success: true, originalName, saveName });
	} catch (error) {
		Sentry.captureException(error);
		return res.status(500).json({ message: "Something went wrong." });
	}
});

export default router;
