import querystring from "node:querystring";

import { WebSocketServer } from "ws";
import jwt from "jsonwebtoken";

import { broker } from "./src/utils/index.js";

const { connectToBroker, disconnectFromBroker, connectToQueue, disconnectFromQueue, sendToQueue } = broker;

const listOfBrokerConnections = {};
const listOfBrokerChannels = {};

const sendTo = (connection, message) => {
	connection.send(JSON.stringify(message));
};

function heartbeat() {
	this.isAlive = true;
}

const initializeWebsocket = (server) => {
	const wss = new WebSocketServer({
		server,
		verifyClient: (info, cb) => {
			const token = querystring.parse(info.req.url)["/websocket?token"];
			if (token) {
				jwt.verify(token, process.env.SERVER_SECRET, (err, decoded) => {
					if (err) {
						cb(false, 401, "Unauthorized");
					} else {
						info.req.user = decoded;
						cb(true);
					}
				});
			} else {
				cb(false, 401, "Unauthorized");
			}
		},
	});

	wss.on("connection", (connection) => {
		connection.isAlive = true;

		connection.on("message", async (message) => {
			let data = {};
			try {
				data = JSON.parse(message);
			} catch (error) {
				console.log("Invalid JSON!");
				console.log(error);
			}

			switch (data.type) {
				case "connectToBroker": {
					const { url, username, password, vhost, protocol } = data;
					const brokerConnection = await connectToBroker(url, username, password, vhost, protocol, () => sendTo(connection, { type: "errorConnectingToBroker" }));
					listOfBrokerConnections[`${url}__${username}__${vhost}__${protocol}`] = brokerConnection;
					if (brokerConnection) {
						sendTo(connection, { type: "connectedToBroker" });
					}

					break;
				}

				case "disconnectFromBroker": {
					const { url, username, vhost, protocol } = data;
					const result = await disconnectFromBroker(listOfBrokerConnections[`${url}__${username}__${vhost}__${protocol}`]);
					if (result) {
						sendTo(connection, { type: "disconnectedFromBroker" });
					} else {
						sendTo(connection, { type: "errorDisconnectingFromBroker" });
					}

					break;
				}

				case "connectToQueue": {
					const { queue, url, username, vhost, protocol } = data;
					const onMessage = (msg) => sendTo(connection, { type: "brokerMessage", message: msg });
					const channel = await connectToQueue(queue, listOfBrokerConnections[`${url}__${username}__${vhost}__${protocol}`], onMessage);
					listOfBrokerChannels[`${url}__${username}__${vhost}__${protocol}__${queue}`] = channel;
					break;
				}

				case "disconnectFromQueue": {
					const { queue, url, username, vhost, protocol } = data;
					const result = await disconnectFromQueue(listOfBrokerChannels[`${url}__${username}__${vhost}__${protocol}__${queue}`]);
					if (result) {
						sendTo(connection, { type: "disconnectedFromQueue" });
					} else {
						sendTo(connection, { type: "errorDisconnectingFromQueue" });
					}

					break;
				}

				case "sendToQueue": {
					const { message: queueMessage, queue, url, username, vhost, protocol } = data;
					await sendToQueue(queueMessage, queue, listOfBrokerChannels[`${url}__${username}__${vhost}__${protocol}__${queue}`]);
					break;
				}

				default: {
					break;
				}
			}
		});

		connection.on("pong", heartbeat);
	});

	const interval = setInterval(() => {
		for (const ws of wss.clients) {
			if (ws.isAlive) {
				ws.isAlive = false;
				ws.ping(() => {});
			} else {
				ws.terminate();
			}
		}
	}, 5000);

	wss.on("close", () => {
		clearInterval(interval);
	});

	wss.on("error", (error) => {
		console.log(error);
	});

	return wss;
};

export default initializeWebsocket;
