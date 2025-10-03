import Sentry from "@sentry/node";
import express from "express";

const router = express.Router({ mergeParams: true });

/**
 * @swagger
 * /:
 *   get:
 *     tags:
 *       - Public
 *     summary: Public route to verify server is working
 *     description: A simple endpoint to check if the server is responding correctly.
 *     responses:
 *       200:
 *         description: Server is working.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "It works!"
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
router.get("/", (req, res) => {
	try {
		return res.json({ message: "It works!" });
	} catch (error) {
		Sentry.captureException(error);
		return res.status(500).json({ message: "Something went wrong." });
	}
});

export default router;
