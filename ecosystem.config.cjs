module.exports = {
	apps: [
		{
			name: "server",
			script: "npm",
			args: "start",
			env: {
				PORT: 4000,
			},
		},
	],
};
