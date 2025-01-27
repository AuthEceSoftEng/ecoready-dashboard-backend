import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "ECO-READY Dashboard API",
      version: "1.0.0",
      description:
        "This is the ECO-READY dashboard API. It is used to host the actions of the backend of the ECO-READY dashboard, and communicates with the different components (mongo users DB, infrastructure, integrations).",
    },
    servers: [
      {
        url: "http://localhost:4000/api/v1",
        description: "Local server",
      },
    ],
  },
  apis: ["./src/routes/*.js"],
};

export default options;
