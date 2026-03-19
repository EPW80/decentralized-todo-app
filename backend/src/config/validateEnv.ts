/**
 * Environment Variable Validation
 * Validates required environment variables at application startup
 * Fails fast if critical configuration is missing or invalid
 */

// eslint-disable-next-line @typescript-eslint/no-var-requires
const logger = require("../utils/logger");

const validateEnv = (): boolean => {
  const errors: string[] = [];

  // Required environment variables
  const requiredVars: string[] = ["MONGODB_URI", "JWT_SECRET"];

  // Check for missing variables
  requiredVars.forEach((varName) => {
    if (!process.env[varName]) {
      errors.push(`${varName} is required but not set`);
    }
  });

  // Validate JWT_SECRET strength
  if (process.env.JWT_SECRET) {
    if (process.env.JWT_SECRET.length < 32) {
      errors.push(
        "JWT_SECRET must be at least 32 characters long for security",
      );
    }

    // Check for common weak values
    const weakSecrets: string[] = [
      "your_super_secret_jwt_key_change_this_in_production",
      "secret",
      "jwt_secret",
      "change_me",
      "please_change_this",
    ];

    if (weakSecrets.includes(process.env.JWT_SECRET)) {
      errors.push(
        "JWT_SECRET is set to a default/weak value. Generate a strong secret with: openssl rand -base64 32",
      );
    }
  }

  // Set secure defaults for NODE_ENV
  if (!process.env.NODE_ENV) {
    logger.warn(
      '⚠️  NODE_ENV not set, defaulting to "production" for security',
    );
    process.env.NODE_ENV = "production";
  }

  // Validate PORT if set
  if (
    process.env.PORT &&
    (isNaN(Number(process.env.PORT)) ||
      Number(process.env.PORT) < 1 ||
      Number(process.env.PORT) > 65535)
  ) {
    errors.push("PORT must be a valid number between 1 and 65535");
  }

  // Validate CORS_ORIGIN format
  if (process.env.CORS_ORIGIN) {
    const origins = process.env.CORS_ORIGIN.split(",").map((o) => o.trim());
    origins.forEach((origin) => {
      if (!origin.match(/^https?:\/\/.+/)) {
        errors.push(
          `Invalid CORS_ORIGIN format: "${origin}". Must start with http:// or https://`,
        );
      }
    });
  }

  // Report errors
  if (errors.length > 0) {
    logger.error("\n❌ ENVIRONMENT VALIDATION FAILED:\n");
    errors.forEach((error: string) => {
      logger.error(`   • ${error}`);
    });
    logger.error(
      "\n📝 Please check your .env file and fix the issues above.\n",
    );
    process.exit(1);
  }

  // Success message
  logger.info("✅ Environment variables validated successfully");
  return true;
};

module.exports = validateEnv;
