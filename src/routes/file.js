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
