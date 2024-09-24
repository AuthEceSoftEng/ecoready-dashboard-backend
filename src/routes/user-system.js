import express from "express";
import { OAuth2Client } from "google-auth-library";

import { validations, email } from "../utils/index.js";
import { User, Reset, Invitation } from "../models/index.js";

const { GOOGLE_CLIENT_ID } = process.env;

const router = express.Router();

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
			const { email: googleEmail, name: googleUsername } = payload;

			// Search for the user in the DB
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

			await email.forgotPassword(user.email, token);
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
			message: "Password updated succesfully",
		});
	} catch (error) {
		return res.json({
			success: false,
			message: error,
		});
	}
});

export default router;
