import sgMail from "@sendgrid/mail";

const {
	CLIENT_URL,
	SENDGRID_API_KEY,
	SENDGRID_EMAIL,
} = process.env;

sgMail.setApiKey(SENDGRID_API_KEY);

const sendEmail = (data, email, templateId) => (
	sgMail.send({
		from: SENDGRID_EMAIL,
		templateId,
		to: email,
		dynamicTemplateData: data,
	})
);

const forgotPassword = (username, to, token) => {
	const msg = {
		from: SENDGRID_EMAIL,
		templateId: "d-5d7274e488ca475293f3c558d99198a0",

		to,

		dynamicTemplateData: {
			Username: username,
			ResetPasswordUrl: `${CLIENT_URL}/reset-password?token=${token}`,
		},
	};

	return sgMail.send(msg);
};

const inviteUser = (to, token) => {
	const msg = {
		from: SENDGRID_EMAIL,
		templateId: "d-22c5ddebeb2849528e2d432f240a3376",

		to,

		dynamicTemplateData: {
			InvitationUrl: `${CLIENT_URL}/register?token=${token}&email=${to}`,
		},
	};

	return sgMail.send(msg);
};

const email = {
	sendEmail,
	forgotPassword,
	inviteUser,
};

export default email;
