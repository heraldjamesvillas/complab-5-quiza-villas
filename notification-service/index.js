const express = require("express");
const amqp = require("amqplib");

const app = express();
app.use(express.json());

const PORT = 3000;
const BROKER_URL =
  process.env.BROKER_URL || "amqp://guest:guest@message-broker:5672";

async function connectRabbitMQ() {
  try {
    const connection = await amqp.connect(BROKER_URL);
    const channel = await connection.createChannel();

    await channel.assertQueue("notifications", { durable: false });

    console.log("Notification Service connected to RabbitMQ");

    return channel;
  } catch (error) {
    console.error("RabbitMQ connection failed:", error.message);
    setTimeout(connectRabbitMQ, 5000);
  }
}

app.get("/", (req, res) => {
  res.json({
    service: "Notification Service",
    status: "running"
  });
});

app.get("/health", (req, res) => {
  res.json({ status: "healthy" });
});

app.post("/notifications", (req, res) => {
  console.log("Notification received:", req.body);

  res.json({
    message: "Notification sent",
    notification: req.body
  });
});

app.listen(PORT, () => {
  console.log(`Notification Service running on port ${PORT}`);
  connectRabbitMQ();
});