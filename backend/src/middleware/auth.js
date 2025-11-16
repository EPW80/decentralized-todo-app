const { ethers } = require("ethers");
const jwt = require("jsonwebtoken");

/**
 * Verify Ethereum signature for wallet-based authentication
 * Expected request format:
 * {
 *   "address": "0x...",
 *   "signature": "0x...",
 *   "message": "Login message with nonce"
 * }
 */
const verifyWalletSignature = async (req, res, next) => {
  try {
    const { address, signature, message } = req.body;

    if (!address || !signature || !message) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: address, signature, message",
      });
    }

    // Verify the signature
    const recoveredAddress = ethers.verifyMessage(message, signature);

    if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
      return res.status(401).json({
        success: false,
        error: "Invalid signature",
      });
    }

    // Attach verified address to request
    req.userAddress = address.toLowerCase();
    next();
  } catch (error) {
    console.error("Signature verification error:", error);
    return res.status(401).json({
      success: false,
      error: "Signature verification failed",
    });
  }
};

/**
 * Optional: Verify JWT token (for session management after initial wallet verification)
 */
const verifyJWT = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1]; // Bearer <token>

    if (!token) {
      return res.status(401).json({
        success: false,
        error: "No token provided",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userAddress = decoded.address.toLowerCase();
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: "Invalid or expired token",
    });
  }
};

/**
 * Generate JWT token after successful wallet verification
 */
const generateToken = (address) => {
  return jwt.sign({ address: address.toLowerCase() }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

/**
 * Middleware to validate Ethereum address format
 */
const validateAddress = (req, res, next) => {
  const address = req.params.address || req.body.address || req.query.address;

  if (!address) {
    return res.status(400).json({
      success: false,
      error: "Address is required",
    });
  }

  if (!ethers.isAddress(address)) {
    return res.status(400).json({
      success: false,
      error: "Invalid Ethereum address format",
    });
  }

  req.validatedAddress = address.toLowerCase();
  next();
};

/**
 * Middleware to ensure the authenticated user owns the resource
 * Use after verifyJWT or verifyWalletSignature
 */
const ensureOwnership = (req, res, next) => {
  const resourceAddress = req.params.address || req.body.owner;

  if (!req.userAddress) {
    return res.status(401).json({
      success: false,
      error: "Authentication required",
    });
  }

  if (resourceAddress && resourceAddress.toLowerCase() !== req.userAddress) {
    return res.status(403).json({
      success: false,
      error: "Access denied: You can only access your own resources",
    });
  }

  next();
};

module.exports = {
  verifyWalletSignature,
  verifyJWT,
  generateToken,
  validateAddress,
  ensureOwnership,
};
