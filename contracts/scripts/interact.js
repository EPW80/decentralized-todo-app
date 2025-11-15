const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Helper script to interact with deployed TodoList contract
 * Usage: npx hardhat run scripts/interact.js --network localhost
 */

async function main() {
  // Get network
  const network = await hre.ethers.provider.getNetwork();
  console.log(`Network: ${network.name} (chainId: ${network.chainId})`);

  // Load deployment info
  const deploymentFile = path.join(
    __dirname,
    "..",
    "deployments",
    `deployment-${network.chainId}.json`
  );

  if (!fs.existsSync(deploymentFile)) {
    console.error("Deployment file not found. Please deploy the contract first.");
    process.exit(1);
  }

  const deploymentInfo = JSON.parse(fs.readFileSync(deploymentFile, "utf8"));
  const todoListAddress = deploymentInfo.contracts.TodoList.address;

  console.log(`TodoList Contract Address: ${todoListAddress}`);

  // Get contract instance
  const TodoList = await hre.ethers.getContractFactory("TodoList");
  const todoList = TodoList.attach(todoListAddress);

  // Get signer
  const [signer] = await hre.ethers.getSigners();
  console.log(`Interacting as: ${signer.address}\n`);

  // Example interactions
  console.log("=== Creating Tasks ===");

  // Create task 1
  console.log("Creating task 1...");
  let tx = await todoList.createTask("Buy groceries");
  await tx.wait();
  console.log("Task 1 created!");

  // Create task 2
  console.log("Creating task 2...");
  tx = await todoList.createTask("Complete project documentation");
  await tx.wait();
  console.log("Task 2 created!");

  // Create task 3
  console.log("Creating task 3...");
  tx = await todoList.createTask("Review pull requests");
  await tx.wait();
  console.log("Task 3 created!\n");

  // Get all user tasks
  console.log("=== Retrieving Tasks ===");
  const taskCount = await todoList.getTaskCount(signer.address);
  console.log(`Total tasks for user: ${taskCount}`);

  const userTasks = await todoList.getUserTasks(signer.address);
  console.log(`Task IDs: ${userTasks.join(", ")}\n`);

  // Get task details
  console.log("=== Task Details ===");
  for (const taskId of userTasks) {
    const task = await todoList.getTask(taskId);
    console.log(`Task ${taskId}:`);
    console.log(`  Description: ${task.description}`);
    console.log(`  Completed: ${task.completed}`);
    console.log(`  Owner: ${task.owner}`);
    console.log(`  Created At: ${new Date(Number(task.createdAt) * 1000).toLocaleString()}`);
    console.log();
  }

  // Complete task 1
  console.log("=== Completing Task 1 ===");
  tx = await todoList.completeTask(1);
  await tx.wait();
  console.log("Task 1 marked as completed!\n");

  // Check completion status
  const isCompleted = await todoList.isTaskCompleted(1);
  console.log(`Task 1 completed status: ${isCompleted}\n`);

  // Get updated task details
  const completedTask = await todoList.getTask(1);
  console.log("Updated Task 1 Details:");
  console.log(`  Completed: ${completedTask.completed}`);
  console.log(
    `  Completed At: ${new Date(Number(completedTask.completedAt) * 1000).toLocaleString()}`
  );
  console.log();

  // Delete task 3
  console.log("=== Deleting Task 3 ===");
  tx = await todoList.deleteTask(3);
  await tx.wait();
  console.log("Task 3 deleted!\n");

  // Get final task count
  const finalCount = await todoList.getTaskCount(signer.address);
  console.log(`Final task count: ${finalCount}`);

  const finalTasks = await todoList.getUserTasks(signer.address);
  console.log(`Remaining task IDs: ${finalTasks.join(", ")}\n`);

  // Get total task count across all users
  const totalTasks = await todoList.getTotalTaskCount();
  console.log(`Total tasks created (all users): ${totalTasks}`);

  console.log("\n=== Interaction Complete ===");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
