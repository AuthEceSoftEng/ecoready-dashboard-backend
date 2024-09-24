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

const forgotPassword = (to, token) => {
	const msg = {
		from: SENDGRID_EMAIL,
		templateId: "d-7815e26a36f7451c8cf2e7b541a796af",

		to,

		dynamicTemplateData: {
			ResetPasswordUrl: `${CLIENT_URL}/reset-password?token=${token}`,
		},
	};

	return sgMail.send(msg);
};

const inviteUser = (to, token) => {
	const msg = {
		from: SENDGRID_EMAIL,
		templateId: "d-dd62b1b2c55748d4bf492a5d7062bf9a",

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
