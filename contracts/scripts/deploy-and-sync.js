const { execSync } = require("child_process");
const updateFrontendConfig = require("./update-frontend-config");

/**
 * Deploy contract and automatically sync configuration to frontend
 */
async function main() {
  try {
    console.log("🚀 Starting deployment and sync process...\n");

    // Run deployment
    console.log("Step 1: Deploying contracts...");
    execSync("npx hardhat run scripts/deploy.js --network localhost", {
      stdio: "inherit",
      cwd: __dirname + "/..",
    });

    console.log("\nStep 2: Updating frontend configuration...");
    await updateFrontendConfig();

    console.log("\n✅ Deployment and sync completed successfully!");
    console.log("\nYou can now:");
    console.log("  1. Refresh your browser");
    console.log("  2. Reconnect your wallet");
    console.log("  3. Start creating tasks!\n");
  } catch (error) {
    console.error("❌ Error during deployment and sync:", error.message);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
