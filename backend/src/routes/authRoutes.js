const express = require("express");
const logger = require("../utils/logger");
const { verifyWalletSignature, generateToken } = require("../middleware/auth");
const router = express.Router();

/**
 * POST /api/auth/login
 * Authenticate user with wallet signature and return JWT token
 *
 * Request body:
 * {
 *   "address": "0x...",
 *   "signature": "0x...",
 *   "message": "Login message with nonce"
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "token": "jwt-token",
 *   "address": "0x..."
 * }
 */
router.post("/login", verifyWalletSignature, (req, res) => {
  try {
    const { userAddress } = req;
    const token = generateToken(userAddress);

    res.json({
      success: true,
      token,
      address: userAddress,
    });
  } catch (error) {
    logger.error("Login error:", { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      error: "Failed to generate authentication token",
    });
  }
});

/**
 * GET /api/auth/nonce/:address
 * Get a nonce for the user to sign
 * This helps prevent replay attacks
 */
router.get("/nonce/:address", (req, res) => {
  const { address } = req.params;

  // Generate a simple nonce (in production, you might want to store these)
  const nonce = Math.floor(Math.random() * 1000000);
  const timestamp = Date.now();

  res.json({
    success: true,
    message: `Sign this message to authenticate with the Todo App.\n\nAddress: ${address}\nNonce: ${nonce}\nTimestamp: ${timestamp}`,
    nonce,
    timestamp,
  });
});

module.exports = router;
