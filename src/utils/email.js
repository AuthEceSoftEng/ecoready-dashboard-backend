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
		templateId: "d-f3eb266de83849139e8d6d5fd696a077",

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
		templateId: "d-c929e517b6564159a4d6fb7ccdadd54d",

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
