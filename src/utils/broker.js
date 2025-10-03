import amqp from "amqplib";

export const connectToBroker = async (url, username, password, vhost, protocol, onError) => {
	const amqpOptions = {
		protocol: protocol.toLowerCase(),
		hostname: url,
		username,
		password,
		vhost,
	};

	try {
		const connection = await amqp.connect(amqpOptions);
		return connection;
	} catch (error) {
		onError(error);
		return null;
	}
};

export const disconnectFromBroker = async (connection) => {
	try {
		await connection.close();
		return true;
	} catch {
		return false;
	}
};

export const connectToQueue = async (queue, connection, onMessage) => {
	const ch = await connection.createChannel();
	await ch.assertQueue(queue);
	await ch.consume(queue, (msg) => {
		onMessage(msg.content.toString());
		ch.ack(msg);
	});
	return ch;
};

export const disconnectFromQueue = async (channel) => {
	try {
		await channel.close();
		return true;
	} catch {
		return false;
	}
};

export const sendToQueue = async (message, queue, channel) => {
	await channel.sendToQueue(queue, Buffer.from(message));
};
