const { ethers } = require("hardhat");

async function main() {
  const contractAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
  const contract = await ethers.getContractAt("TodoListV2", contractAddress);
  
  // Get task #4
  const task = await contract.getTask(4);
  
  console.log("Task #4 Details:");
  console.log("  Description:", task.description);
  console.log("  Completed:", task.completed);
  console.log("  Deleted:", task.deleted);
  console.log("  Created At:", new Date(Number(task.createdAt) * 1000).toISOString());
  if (task.completed) {
    console.log("  Completed At:", new Date(Number(task.completedAt) * 1000).toISOString());
  }
  
  // Get current block number
  const currentBlock = await ethers.provider.getBlockNumber();
  console.log("\nCurrent block:", currentBlock);
  
  // Try to find TaskCompleted event for task #4
  console.log("\nSearching for TaskCompleted events for task #4...");
  const filter = contract.filters.TaskCompleted(4);
  const events = await contract.queryFilter(filter, 0, currentBlock);
  
  if (events.length > 0) {
    events.forEach(event => {
      console.log("  Found TaskCompleted event:");
      console.log("    Block:", event.blockNumber);
      console.log("    Transaction:", event.transactionHash);
    });
  } else {
    console.log("  No TaskCompleted events found for task #4");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
