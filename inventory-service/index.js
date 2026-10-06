const express = require("express");
const amqp = require("amqplib");

const app = express();
app.use(express.json());

const PORT = 3000;

const BROKER_URL =
  process.env.BROKER_URL || "amqp://guest:guest@message-broker:5672";

let channel;

async function connectRabbitMQ() {
  try {
    const connection = await amqp.connect(BROKER_URL);

    channel = await connection.createChannel();

    await channel.assertQueue("inventory", {
      durable: true
    });

    console.log("Connected to RabbitMQ");
    console.log("Inventory service is ready");
  } catch (error) {
    console.error("RabbitMQ connection failed:", error.message);

    setTimeout(connectRabbitMQ, 5000);
  }
}

app.get("/", (req, res) => {
  res.json({
    service: "inventory-service",
    status: "running"
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "healthy"
  });
});

app.post("/inventory", (req, res) => {
  const item = req.body;

  if (!channel) {
    return res.status(503).json({
      error: "RabbitMQ is not connected yet"
    });
  }

  channel.sendToQueue(
    "inventory",
    Buffer.from(JSON.stringify(item)),
    {
      persistent: true
    }
  );

  console.log("Inventory message sent:", item);

  res.json({
    message: "Inventory updated successfully",
    item: item
  });
});

app.listen(PORT, () => {
  console.log(`Inventory service running on port ${PORT}`);
  connectRabbitMQ();
});