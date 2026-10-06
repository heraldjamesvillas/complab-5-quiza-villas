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

    await channel.assertQueue("orders", {
      durable: true
    });

    console.log("Connected to RabbitMQ");
    console.log("Order service is ready");
  } catch (error) {
    console.error("RabbitMQ connection failed:", error.message);

    setTimeout(connectRabbitMQ, 5000);
  }
}

app.get("/", (req, res) => {
  res.json({
    service: "order-service",
    status: "running"
  });
});

app.post("/orders", (req, res) => {
  const order = req.body;

  if (!channel) {
    return res.status(503).json({
      error: "RabbitMQ is not connected yet"
    });
  }

  channel.sendToQueue(
    "orders",
    Buffer.from(JSON.stringify(order)),
    {
      persistent: true
    }
  );

  console.log("Order sent:", order);

  res.json({
    message: "Order created successfully",
    order: order
  });
});

app.listen(PORT, () => {
  console.log(`Order service running on port ${PORT}`);
  connectRabbitMQ();
});