const express = require("express");
const mongoose = require("mongoose");
const blockchainService = require("../services/blockchainService");

const router = express.Router();

// Health check endpoint
router.get("/", async (req, res) => {
  try {
    const health = {
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || "development",
      services: {
        database:
          mongoose.connection.readyState === 1 ? "connected" : "disconnected",
        blockchain: blockchainService.isInitialized()
          ? "connected"
          : "disconnected",
      },
    };

    // Get blockchain network info if available
    if (blockchainService.isInitialized()) {
      const networkInfo = await blockchainService.getNetworkInfo();
      health.blockchain = networkInfo;
    }

    const statusCode =
      health.services.database === "connected" &&
      health.services.blockchain === "connected"
        ? 200
        : 503;

    res.status(statusCode).json(health);
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
});

// Detailed health status endpoint with heartbeat information
router.get("/detailed", async (req, res) => {
  try {
    const health = {
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || "development",
      services: {
        database:
          mongoose.connection.readyState === 1 ? "connected" : "disconnected",
        blockchain: blockchainService.isInitialized()
          ? "connected"
          : "disconnected",
      },
    };

    // Get blockchain network info if available
    if (blockchainService.isInitialized()) {
      const networkInfo = await blockchainService.getNetworkInfo();
      const healthStatus = blockchainService.getHealthStatus();

      health.blockchain = {
        networks: networkInfo,
        monitoring: healthStatus
      };
    }

    const statusCode =
      health.services.database === "connected" &&
      health.services.blockchain === "connected"
        ? 200
        : 503;

    res.status(statusCode).json(health);
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
});

module.exports = router;
