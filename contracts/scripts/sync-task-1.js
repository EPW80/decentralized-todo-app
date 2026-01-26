const { ethers } = require('hardhat');
const mongoose = require('mongoose');

async function main() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/decentralized-todo');
    console.log('Connected to MongoDB');

    // Get contract
    const contractAddress = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512';
    const contract = await ethers.getContractAt('TodoListV2', contractAddress);

    // Get task 1
    const task = await contract.getTask(1);
    console.log('\nTask 1 from blockchain:');
    console.log('  Description:', task.description);
    console.log('  Owner:', task.owner);
    console.log('  Completed:', task.completed);
    console.log('  Deleted:', task.deleted);
    console.log('  Created At:', new Date(Number(task.createdAt) * 1000).toISOString());

    // Define Todo model
    const TodoSchema = new mongoose.Schema({
      blockchainId: { type: String, required: true },
      chainId: { type: Number, required: true },
      transactionHash: { type: String, default: '' },
      owner: { type: String, required: true },
      description: { type: String, required: true },
      completed: { type: Boolean, default: false },
      blockchainCreatedAt: { type: Date },
      blockchainCompletedAt: { type: Date },
      syncStatus: { type: String, default: 'synced' },
      deleted: { type: Boolean, default: false },
      deletedAt: { type: Date },
      lastSyncedAt: { type: Date, default: Date.now },
    }, { timestamps: true });

    const Todo = mongoose.models.Todo || mongoose.model('Todo', TodoSchema);

    // Check if already exists
    const existing = await Todo.findOne({ blockchainId: '1', chainId: 31337 });
    if (existing) {
      console.log('\nTask 1 already exists in MongoDB');
    } else {
      // Create new todo
      const newTodo = new Todo({
        blockchainId: '1',
        chainId: 31337,
        transactionHash: '',
        owner: task.owner.toLowerCase(),
        description: task.description,
        completed: task.completed,
        blockchainCreatedAt: new Date(Number(task.createdAt) * 1000),
        blockchainCompletedAt: task.completed ? new Date(Number(task.completedAt) * 1000) : null,
        syncStatus: 'synced',
        deleted: task.deleted,
        deletedAt: task.deleted ? new Date() : null,
        lastSyncedAt: new Date(),
      });

      await newTodo.save();
      console.log('\n✅ Task 1 synced to MongoDB successfully!');
    }

    await mongoose.connection.close();
    console.log('\nMongoDB connection closed');

  } catch (error) {
    console.error('Error:', error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
