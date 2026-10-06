const express = require("express");
const cors = require("cors");

const app = express();

const PORT = 8080;

const ORDER_SERVICE_URL =
  process.env.ORDER_SERVICE_URL || "http://order-service:3000";

const CORS_ORIGIN =
  process.env.CORS_ORIGIN || "http://localhost:3000";

app.use(
  cors({
    origin: CORS_ORIGIN
  })
);

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    service: "api-gateway",
    status: "running"
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "healthy"
  });
});

app.post("/orders", async (req, res) => {
  try {
    const response = await fetch(`${ORDER_SERVICE_URL}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(req.body)
    });

    const data = await response.json();

    res.status(response.status).json(data);
  } catch (error) {
    console.error("Order service error:", error.message);

    res.status(503).json({
      error: "Order service is unavailable"
    });
  }
});

app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
  console.log(`Order Service URL: ${ORDER_SERVICE_URL}`);
});