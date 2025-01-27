import express from "express";
import { OAuth2Client } from "google-auth-library";

import { validations, email } from "../utils/index.js";
import { User, Reset, Invitation } from "../models/index.js";

const { GOOGLE_CLIENT_ID } = process.env;

const router = express.Router();

/**
 * @swagger
 * /createUser:
 *   post:
 *     tags:
 *       - Users
 *     summary: Create a new user
 *     description: Validates and creates a new user in the system.
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 example: johndoe
 *               password:
 *                 type: string
 *                 example: password123
 *               email:
 *                 type: string
 *                 example: johndoe@example.com
 *     responses:
 *       200:
 *         description: User created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: User created successfully.
 *       409:
 *         description: Conflict - A user with the same username or email already exists.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 409
 *                 message:
 *                   type: string
 *                   example: "Registration Error: A user with that e-mail or username already exists."
 */
router.post("/createUser",
	(req, res, next) => validations.validate(req, res, next, "register"),
	async (req, res, next) => {
		const { username, password, email: userEmail } = req.body;
		try {
			const user = await User.findOne({ $or: [{ username }, { email: userEmail }] });
			if (user) {
				return res.json({
					status: 409,
					message: "Registration Error: A user with that e-mail or username already exists.",
				});
			}

			await new User({
				username,
				password,
				email: userEmail,
			}).save();
			return res.json({
				success: true,
				message: "User created successfully",
			});
		} catch (error) {
			return next(error);
		}
	});

/**
 * @swagger
 * /createUserInvited:
 *   post:
 *     tags:
 *       - Users
 *     summary: Create a new user with an invitation token
 *     description: Validates and creates a new user in the system using an invitation token.
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 example: johndoe
 *               password:
 *                 type: string
 *                 example: password123
 *               email:
 *                 type: string
 *                 example: johndoe@example.com
 *               token:
 *                 type: string
 *                 example: 123456789abcdef
 *     responses:
 *       200:
 *         description: User created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: User created successfully.
 *       409:
 *         description: Conflict - A user with the same username or email already exists.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 409
 *                 message:
 *                   type: string
 *                   example: "Registration Error: A user with that e-mail or username already exists."
 */
router.post("/createUserInvited",
	(req, res, next) => validations.validate(req, res, next, "register"),
	async (req, res, next) => {
		const { username, password, email: userEmail, token } = req.body;
		try {
			const invitation = await Invitation.findOne({ token });

			if (!invitation) {
				return res.json({
					success: false,
					message: "Invalid token",
				});
			}

			const user = await User.findOne({ $or: [{ username }, { email: userEmail }] });
			if (user) {
				return res.json({
					status: 409,
					message: "Registration Error: A user with that e-mail or username already exists.",
				});
			}

			await new User({
				username,
				password,
				email: userEmail,
			}).save();

			await Invitation.deleteOne({ token });

			return res.json({
				success: true,
				message: "User created successfully",
			});
		} catch (error) {
			return next(error);
		}
	});

/**
 * @swagger
 * /authenticate:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Authenticate a user
 *     description: Validates and authenticates a user in the system.
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 example: johndoe
 *               password:
 *                 type: string
 *                 example: password123
 *     responses:
 *       200:
 *         description: Authentication successful.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 user:
 *                   type: object
 *                   properties:
 *                     username:
 *                       type: string
 *                       example: johndoe
 *                     id:
 *                       type: string
 *                       example: 609b76e9ec1a3e15d474e126
 *                     email:
 *                       type: string
 *                       example: johndoe@example.com
 *                 token:
 *                   type: string
 *                   example: jwt-token
 *       401:
 *         description: Authentication failed - Invalid credentials.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 status:
 *                   type: integer
 *                   example: 401
 *                 message:
 *                   type: string
 *                   example: "Authentication Error: User not found."
 */
router.post("/authenticate",
	(req, res, next) => validations.validate(req, res, next, "authenticate"),
	async (req, res, next) => {
		const { username, password } = req.body;
		try {
			const user = await User.findOne({ username }).select("+password");
			if (!user) {
				return res.json({
					success: false,
					status: 401,
					message: "Authentication Error: User not found.",
				});
			}

			if (!user.comparePassword(password, user.password)) {
				return res.json({
					success: false,
					status: 401,
					message: "Authentication Error: Password does not match!",
				});
			}

			return res.json({
				success: true,
				user: {
					username,
					id: user._id,
					email: user.email,
				},
				token: validations.jwtSign({ username, id: user._id, email: user.email }),
			});
		} catch (error) {
			return next(error);
		}
	});

/**
 * @swagger
 * /authenticateGoogle:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Authenticate a user using Google OAuth
 *     description: Authenticates a user using their Google account and returns a token.
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *                 example: "eyJhbGciOiJSUzI1NiIsInR5cCI..."
 *     responses:
 *       200:
 *         description: Authentication successful.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 user:
 *                   type: object
 *                   properties:
 *                     email:
 *                       type: string
 *                       example: johndoe@example.com
 *                     id:
 *                       type: string
 *                       example: 609b76e9ec1a3e15d474e126
 *                     username:
 *                       type: string
 *                       example: John Doe
 *                 token:
 *                   type: string
 *                   example: jwt-token
 *       400:
 *         description: Authentication failed - Invalid token.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Authentication error"
 */
router.post("/authenticateGoogle",
	(req, res, next) => validations.validate(req, res, next, "authenticateGoogle"),
	async (req, res, next) => {
		const { token: tokenId } = req.body;
		try {
			// Connect to google client with the application's id
			const client = new OAuth2Client(GOOGLE_CLIENT_ID);

			// Verify the token provided by the user
			const ticket = await client.verifyIdToken({
				idToken: tokenId,
				audience: GOOGLE_CLIENT_ID,
			});

			if (!ticket) {
				return res.json({
					success: false,
					message: "Authentication error",
				});
			}

			// Get the email and name of the user
			const payload = ticket.getPayload();

			// Search for the user in the DB
			const { email: googleEmail, name: googleUsername } = payload;

			let user = await User.findOne({ email: googleEmail });
			if (user) {
				if (!user.username) {
					user.username = googleUsername;
					await user.save();
				}
			} else {
				// Create a user that didn't existed
				user = await new User({
					email: googleEmail,
					username: googleUsername,
				}).save();
			}

			// Generate the user's token
			const token = validations.jwtSign({ email, id: user._id, username: googleUsername });

			return res.json({
				success: true,
				user: { email, id: user._id, username: googleUsername },
				token,
			});
		} catch (error) {
			return next(error);
		}
	});

/**
 * @swagger
 * /forgotpassword:
 *   post:
 *     tags:
 *       - Password
 *     summary: Request password reset
 *     description: Sends a password reset email to the user.
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 example: johndoe
 *     responses:
 *       200:
 *         description: Password reset email sent successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Forgot password e-mail sent.
 *       404:
 *         description: User not found or other errors.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 404
 *                 message:
 *                   type: string
 *                   example: "Resource Error: User not found."
 */
router.post("/forgotpassword",
	(req, res, next) => validations.validate(req, res, next, "request"),
	async (req, res) => {
		try {
			const { username } = req.body;

			const user = await User.findOne({ username }).select("+password");
			if (!user) {
				return res.json({
					status: 404,
					message: "Resource Error: User not found.",
				});
			}

			if (!user?.password) {
				return res.json({
					status: 404,
					message: "User has logged in with google",
				});
			}

			const token = validations.jwtSign({ username });
			await Reset.findOneAndRemove({ username });
			await new Reset({
				username,
				token,
			}).save();

			await email.forgotPassword(username, user.email, token);
			return res.json({
				success: true,
				message: "Forgot password e-mail sent.",
			});
		} catch (error) {
			return res.json({
				success: false,
				message: error.body,
			});
		}
	});

/**
 * @swagger
 * /resetpassword:
 *   post:
 *     tags:
 *       - Password
 *     summary: Reset a user's password
 *     description: Resets the user's password using a valid token.
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *                 example: "eyJhbGciOiJIUzI1NiIsInR5cCI..."
 *               password:
 *                 type: string
 *                 example: "newpassword123"
 *     responses:
 *       200:
 *         description: Password reset successful.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Password updated successfully."
 *       400:
 *         description: Invalid token or token expired.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Token expired."
 */
router.post("/resetpassword", async (req, res) => {
	const { token, password } = req.body;

	try {
		const reset = await Reset.findOne({ token });

		if (!reset) {
			return res.json({
				status: 400,
				message: "Invalid Token!",
			});
		}

		const today = new Date();

		if (reset.expireAt < today) {
			return res.json({
				success: false,
				message: "Token expired",
			});
		}

		const user = await User.findOne({ username: reset.username });
		if (!user) {
			return res.json({
				success: false,
				message: "User does not exist",
			});
		}

		user.password = password;
		await user.save();
		await Reset.deleteOne({ _id: reset._id });

		return res.json({
			success: true,
			message: "Password updated successfully",
		});
	} catch (error) {
		return res.json({
			success: false,
			message: error,
		});
	}
});

// import { CollectionDataManagement } from "../utils/index.js";
// router.post("/mycall", async (req, res) => {
//	try {
//		const { organization, project, collection, accessKey } = req.body;
//		const response = await CollectionDataManagement.getData(organization, project, collection, accessKey);
//		console.log(response[0]);
//		return res.json({success: true, message: response});
//	} catch (error) {
//		console.log(error);
//		Sentry.captureException(error);
//		return res.status(500).json({ message: "Something went wrong." });
//	}
//	//	return res.json({
//	//		success: true,
//	//		message: "Yo, It works!",
//	//	});
// });

export default router;
