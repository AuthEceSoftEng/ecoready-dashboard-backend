import "dotenv/config";

import path from "node:path";
import fs from "node:fs";
import url, { fileURLToPath } from "node:url";
import http from "node:http";

import express from "express";
import morgan from "morgan";
import compression from "compression";
import favicon from "serve-favicon";
import cors from "cors";
import chalk from "chalk";
import Sentry from "@sentry/node";
import helmet from "helmet";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import swaggerUiDist from "swagger-ui-dist";

import swaggerOptions from "./swagger.js"; // Import Swagger configuration
import routes from "./src/routes/index.js";
import { setServerTimeout } from "./src/middleware/index.js";
import { attachUser, init } from "./src/utils/index.js";
import initializeWebsocket from "./websocket.js";

const swaggerSpec = swaggerJsdoc(swaggerOptions); // Generate Swagger documentation

const { NODE_ENV, SENTRY_DSN, SENTRY_ENVIRONMENT, PORT } = process.env;

Sentry.init({
	enabled: NODE_ENV === "production",
	dsn: SENTRY_DSN,
	environment: SENTRY_ENVIRONMENT,
	tracesSampleRate: 1,
	profilesSampleRate: 1,
});

// Initialize mongoDB connection
init();

const app = express();
const server = http.Server(app);

app.use(Sentry.Handlers.requestHandler());

app.use(
	helmet({
		crossOriginResourcePolicy: false,
	}),
);
app.use(setServerTimeout(2 * 60 * 1000));
if (NODE_ENV === "development") app.use(morgan("dev", { skip: (req) => req.method === "OPTIONS" }));
app.use(cors({ credentials: true, origin: true }));
app.use(compression());
app.use(express.json({ limit: "1mb" }));
app.use((req, _, next) => {
	req.body ||= {};
	next();
});
app.use(express.urlencoded({ extended: true, limit: "5mb" }));
app.use(
	favicon(
		path.join(
			path.dirname(fileURLToPath(import.meta.url)),
			"src",
			"assets",
			"images",
			"favicon.ico",
		),
	),
);

app.use("/api-docs", express.static(swaggerUiDist.getAbsoluteFSPath()));

app.use(
	"/api-docs",
	swaggerUi.serve,
	swaggerUi.setup(swaggerSpec, {
		customCss: ".swagger-ui .topbar { display: none } /* Removes the entire top bar */",
		customSiteTitle: "ECO-READY Dashboard API",
		customfavIcon: "./src/assets/images/favicon.ico",
	}),
);

app.use("/api", routes);

// Server static files
const uploadFolderPath = path.join(
	path.dirname(url.fileURLToPath(import.meta.url)),
	"src/assets/uploads",
);
if (!fs.existsSync(uploadFolderPath)) {
	fs.mkdirSync(uploadFolderPath, { recursive: true });
}

app.use(
	"/uploads/",
	[attachUser, express.static(path.join(path.dirname(fileURLToPath(import.meta.url)), "src/assets/uploads"))],
);

app.all("/*", (_, res) => res.json({ body: "It works!" }));

app.use(Sentry.Handlers.errorHandler());

const port = PORT || 4000;
server.listen(port, () => NODE_ENV !== "test" && console.log(chalk.bold.cyan(`>>> Live at http://localhost:${port}`)));

// Start the websocket server
initializeWebsocket(server);

export default app;
