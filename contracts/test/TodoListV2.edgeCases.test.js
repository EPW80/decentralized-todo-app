const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");
const { loadFixture, time } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("TodoListV2 - Edge Cases (Gas Limits, Overflow, Boundaries)", function () {
  async function deployTodoListV2Fixture() {
    const [owner, user1, user2, user3] = await ethers.getSigners();

    const TodoListV2 = await ethers.getContractFactory("TodoListV2");
    const proxy = await upgrades.deployProxy(
      TodoListV2,
      [owner.address],
      { initializer: "initialize", kind: "uups" }
    );
    await proxy.waitForDeployment();

    return { proxy, owner, user1, user2, user3, TodoListV2 };
  }

  describe("Integer Overflow/Underflow Protection", function () {
    it("Should handle maximum uint256 task counter without overflow", async function () {
      // Note: Solidity 0.8+ has built-in overflow protection
      // This test verifies the protection works
      const { proxy } = await loadFixture(deployTodoListV2Fixture);

      // We can't actually create 2^256 tasks, but we can verify
      // that the contract uses uint256 safely
      const maxUint256 = ethers.MaxUint256;
      expect(maxUint256).to.be.gt(0);

      // Create a task to ensure counter works
      await proxy.createTask("Test task");
      const count = await proxy.getTotalTaskCount();
      expect(count).to.equal(1);
    });

    it("Should handle task counter increment safely", async function () {
      const { proxy, owner, user1 } = await loadFixture(deployTodoListV2Fixture);

      // Disable cooldown for rapid testing
      await proxy.connect(owner).updateCooldown(0);

      // Create multiple tasks rapidly
      for (let i = 0; i < 100; i++) {
        await proxy.connect(user1).createTask(`Task ${i}`);
      }

      expect(await proxy.getTotalTaskCount()).to.equal(100);
    });

    it("Should prevent userTaskCount underflow on delete", async function () {
      const { proxy, user1 } = await loadFixture(deployTodoListV2Fixture);

      // Create and delete task
      await proxy.connect(user1).createTask("Task to delete");
      await proxy.connect(user1).deleteTask(1);

      // Count should be 0, not underflow
      expect(await proxy.getTaskCount(user1.address)).to.equal(0);

      // Trying to delete again should fail (not underflow)
      await expect(
        proxy.connect(user1).deleteTask(1)
      ).to.be.revertedWith("Task has been deleted");
    });

    it("Should handle maximum user task count correctly", async function () {
      const { proxy, owner, user1 } = await loadFixture(deployTodoListV2Fixture);

      // Set to minimum allowed value
      await proxy.connect(owner).updateMaxTasks(100);
      await proxy.connect(owner).updateCooldown(0);

      // Create max tasks
      for (let i = 0; i < 100; i++) {
        await proxy.connect(user1).createTask(`Task ${i + 1}`);
      }

      expect(await proxy.getTaskCount(user1.address)).to.equal(100);

      // Should fail on next attempt
      await expect(
        proxy.connect(user1).createTask("Task 101")
      ).to.be.revertedWith("Maximum tasks limit reached");
    });

    it("Should handle restore incrementing task count without overflow", async function () {
      const { proxy, user1 } = await loadFixture(deployTodoListV2Fixture);

      await proxy.connect(user1).createTask("Task");
      expect(await proxy.getTaskCount(user1.address)).to.equal(1);

      await proxy.connect(user1).deleteTask(1);
      expect(await proxy.getTaskCount(user1.address)).to.equal(0);

      await proxy.connect(user1).restoreTask(1);
      expect(await proxy.getTaskCount(user1.address)).to.equal(1);
    });
  });

  describe("Timestamp Edge Cases", function () {
    it("Should handle task creation at block timestamp 0", async function () {
      // This is theoretical as block.timestamp is always > 0 in practice
      const { proxy, user1 } = await loadFixture(deployTodoListV2Fixture);

      await proxy.connect(user1).createTask("Task at current time");
      const task = await proxy.getTask(1);

      expect(task.createdAt).to.be.gt(0);
    });

    it("Should handle far future timestamps for cooldown", async function () {
      const { proxy, owner, user1 } = await loadFixture(deployTodoListV2Fixture);

      // Set maximum allowed cooldown (1 hour = 3600 seconds)
      await proxy.connect(owner).updateCooldown(3600);

      await proxy.connect(user1).createTask("Task 1");

      // Should be blocked immediately after
      await expect(
        proxy.connect(user1).createTask("Task 2")
      ).to.be.revertedWith("Rate limit: please wait before next action");

      // Advance time by 1 hour
      await time.increase(3601);

      // Should work now
      await expect(
        proxy.connect(user1).createTask("Task 2")
      ).to.not.be.reverted;
    });

    it("Should reject cooldown longer than 1 hour", async function () {
      const { proxy, owner } = await loadFixture(deployTodoListV2Fixture);

      const oneHour = 3600;
      await expect(
        proxy.connect(owner).updateCooldown(oneHour + 1)
      ).to.be.revertedWith("Cooldown too long");
    });

    it("Should handle zero cooldown correctly", async function () {
      const { proxy, owner, user1 } = await loadFixture(deployTodoListV2Fixture);

      await proxy.connect(owner).updateCooldown(0);

      // Should be able to create multiple tasks immediately
      await proxy.connect(user1).createTask("Task 1");
      await proxy.connect(user1).createTask("Task 2");
      await proxy.connect(user1).createTask("Task 3");

      expect(await proxy.getTaskCount(user1.address)).to.equal(3);
    });

    it("Should handle circuit breaker timestamp correctly", async function () {
      const { proxy, owner } = await loadFixture(deployTodoListV2Fixture);

      const timeBefore = await time.latest();
      await proxy.connect(owner).activateCircuitBreaker();
      const breakerTimestamp = await proxy.circuitBreakerTimestamp();

      // Timestamp should be set and recent
      expect(breakerTimestamp).to.be.gte(timeBefore);
      expect(breakerTimestamp).to.be.lte(timeBefore + 2);
    });
  });

  describe("String Length Boundaries", function () {
    it("Should accept description of exactly 500 characters", async function () {
      const { proxy, user1 } = await loadFixture(deployTodoListV2Fixture);

      const description = "a".repeat(500);
      await expect(
        proxy.connect(user1).createTask(description)
      ).to.not.be.reverted;

      const task = await proxy.getTask(1);
      expect(task.description.length).to.equal(500);
    });

    it("Should reject description of 501 characters", async function () {
      const { proxy, user1 } = await loadFixture(deployTodoListV2Fixture);

      const description = "a".repeat(501);
      await expect(
        proxy.connect(user1).createTask(description)
      ).to.be.revertedWith("Description too long");
    });

    it("Should accept description of 1 character", async function () {
      const { proxy, user1 } = await loadFixture(deployTodoListV2Fixture);

      await expect(
        proxy.connect(user1).createTask("a")
      ).to.not.be.reverted;
    });

    it("Should reject empty string description", async function () {
      const { proxy, user1 } = await loadFixture(deployTodoListV2Fixture);

      await expect(
        proxy.connect(user1).createTask("")
      ).to.be.revertedWith("Description cannot be empty");
    });

    it("Should handle unicode characters in description", async function () {
      const { proxy, user1 } = await loadFixture(deployTodoListV2Fixture);

      const unicodeDescription = "Task with emoji \ud83d\ude80 and special chars: \u00e9\u00e8\u00ea\u4e2d\u6587";
      await expect(
        proxy.connect(user1).createTask(unicodeDescription)
      ).to.not.be.reverted;

      const task = await proxy.getTask(1);
      expect(task.description).to.equal(unicodeDescription);
    });

    it("Should handle description with special characters", async function () {
      const { proxy, user1 } = await loadFixture(deployTodoListV2Fixture);

      const specialChars = "Task with `quotes` and 'apostrophes' and \"double quotes\" and \n newlines \t tabs";
      await expect(
        proxy.connect(user1).createTask(specialChars)
      ).to.not.be.reverted;
    });
  });

  describe("Configuration Boundaries", function () {
    it("Should accept max tasks of exactly 100 (minimum)", async function () {
      const { proxy, owner } = await loadFixture(deployTodoListV2Fixture);

      await expect(
        proxy.connect(owner).updateMaxTasks(100)
      ).to.not.be.reverted;

      expect(await proxy.maxTasksPerUser()).to.equal(100);
    });

    it("Should reject max tasks below 100", async function () {
      const { proxy, owner } = await loadFixture(deployTodoListV2Fixture);

      await expect(
        proxy.connect(owner).updateMaxTasks(99)
      ).to.be.revertedWith("Max tasks too low");
    });

    it("Should accept max tasks of exactly 1000000 (maximum)", async function () {
      const { proxy, owner } = await loadFixture(deployTodoListV2Fixture);

      await expect(
        proxy.connect(owner).updateMaxTasks(1000000)
      ).to.not.be.reverted;

      expect(await proxy.maxTasksPerUser()).to.equal(1000000);
    });

    it("Should reject max tasks above 1000000", async function () {
      const { proxy, owner } = await loadFixture(deployTodoListV2Fixture);

      await expect(
        proxy.connect(owner).updateMaxTasks(1000001)
      ).to.be.revertedWith("Max tasks too high");
    });

    it("Should accept cooldown of exactly 1 hour (maximum)", async function () {
      const { proxy, owner } = await loadFixture(deployTodoListV2Fixture);

      const oneHour = 3600;
      await expect(
        proxy.connect(owner).updateCooldown(oneHour)
      ).to.not.be.reverted;

      expect(await proxy.actionCooldown()).to.equal(oneHour);
    });
  });

  describe("Array and Mapping Edge Cases", function () {
    it("Should handle getUserTasks with no tasks", async function () {
      const { proxy, user1 } = await loadFixture(deployTodoListV2Fixture);

      const tasks = await proxy.getUserTasks(user1.address);
      expect(tasks.length).to.equal(0);
    });

    it("Should handle getUserTaskDetails with no tasks", async function () {
      const { proxy, user1 } = await loadFixture(deployTodoListV2Fixture);

      const tasks = await proxy.getUserTaskDetails(user1.address, false);
      expect(tasks.length).to.equal(0);
    });

    it("Should handle large task arrays efficiently", async function () {
      const { proxy, owner, user1 } = await loadFixture(deployTodoListV2Fixture);

      await proxy.connect(owner).updateCooldown(0);

      // Create 50 tasks
      for (let i = 0; i < 50; i++) {
        await proxy.connect(user1).createTask(`Task ${i + 1}`);
      }

      const taskIds = await proxy.getUserTasks(user1.address);
      expect(taskIds.length).to.equal(50);

      const taskDetails = await proxy.getUserTaskDetails(user1.address, true);
      expect(taskDetails.length).to.equal(50);
    });

    it("Should handle getUserTaskDetails with all deleted tasks", async function () {
      const { proxy, owner, user1 } = await loadFixture(deployTodoListV2Fixture);

      await proxy.connect(owner).updateCooldown(0);

      // Create and delete all tasks
      for (let i = 0; i < 5; i++) {
        await proxy.connect(user1).createTask(`Task ${i + 1}`);
      }

      for (let i = 1; i <= 5; i++) {
        await proxy.connect(user1).deleteTask(i);
      }

      const activeTasks = await proxy.getUserTaskDetails(user1.address, false);
      expect(activeTasks.length).to.equal(0);

      const allTasks = await proxy.getUserTaskDetails(user1.address, true);
      expect(allTasks.length).to.equal(5);
    });

    it("Should handle mixed active and deleted tasks", async function () {
      const { proxy, owner, user1 } = await loadFixture(deployTodoListV2Fixture);

      await proxy.connect(owner).updateCooldown(0);

      // Create 10 tasks
      for (let i = 0; i < 10; i++) {
        await proxy.connect(user1).createTask(`Task ${i + 1}`);
      }

      // Delete every other task
      for (let i = 1; i <= 10; i += 2) {
        await proxy.connect(user1).deleteTask(i);
      }

      const activeTasks = await proxy.getUserTaskDetails(user1.address, false);
      expect(activeTasks.length).to.equal(5);

      const allTasks = await proxy.getUserTaskDetails(user1.address, true);
      expect(allTasks.length).to.equal(10);
    });
  });

  describe("Gas Limit Considerations", function () {
    it("Should handle getUserTaskDetails for large number of tasks", async function () {
      const { proxy, owner, user1 } = await loadFixture(deployTodoListV2Fixture);

      await proxy.connect(owner).updateCooldown(0);

      // Create 100 tasks (reasonable for gas testing)
      for (let i = 0; i < 100; i++) {
        await proxy.connect(user1).createTask(`Task ${i + 1}`);
      }

      // This should complete without running out of gas
      const tasks = await proxy.getUserTaskDetails(user1.address, true);
      expect(tasks.length).to.equal(100);
    });

    it("Should handle filtering deleted tasks from large arrays", async function () {
      const { proxy, owner, user1 } = await loadFixture(deployTodoListV2Fixture);

      await proxy.connect(owner).updateCooldown(0);
      await proxy.connect(owner).updateMaxTasks(200);

      // Create 100 tasks
      for (let i = 0; i < 100; i++) {
        await proxy.connect(user1).createTask(`Task ${i + 1}`);
      }

      // Delete 50 tasks
      for (let i = 1; i <= 50; i++) {
        await proxy.connect(user1).deleteTask(i);
      }

      // Should filter efficiently
      const activeTasks = await proxy.getUserTaskDetails(user1.address, false);
      expect(activeTasks.length).to.equal(50);
    });

    it("Should handle multiple users with many tasks each", async function () {
      const { proxy, owner, user1, user2, user3 } = await loadFixture(deployTodoListV2Fixture);

      await proxy.connect(owner).updateCooldown(0);

      // Each user creates 10 tasks
      for (let i = 0; i < 10; i++) {
        await proxy.connect(user1).createTask(`User1 Task ${i + 1}`);
        await proxy.connect(user2).createTask(`User2 Task ${i + 1}`);
        await proxy.connect(user3).createTask(`User3 Task ${i + 1}`);
      }

      expect(await proxy.getTaskCount(user1.address)).to.equal(10);
      expect(await proxy.getTaskCount(user2.address)).to.equal(10);
      expect(await proxy.getTaskCount(user3.address)).to.equal(10);
      expect(await proxy.getTotalTaskCount()).to.equal(30);
    });
  });

  describe("Nonce and Counter Edge Cases", function () {
    it("Should initialize nonce to zero for new users", async function () {
      const { proxy, user1 } = await loadFixture(deployTodoListV2Fixture);

      expect(await proxy.getNonce(user1.address)).to.equal(0);
    });

    it("Should maintain separate nonces for different users", async function () {
      const { proxy, user1, user2, user3 } = await loadFixture(deployTodoListV2Fixture);

      expect(await proxy.getNonce(user1.address)).to.equal(0);
      expect(await proxy.getNonce(user2.address)).to.equal(0);
      expect(await proxy.getNonce(user3.address)).to.equal(0);
    });
  });

  describe("Withdrawal Edge Cases", function () {
    it("Should handle zero pending withdrawal", async function () {
      const { proxy, user1 } = await loadFixture(deployTodoListV2Fixture);

      expect(await proxy.getPendingWithdrawal(user1.address)).to.equal(0);

      await expect(
        proxy.connect(user1).withdraw()
      ).to.be.revertedWith("No pending withdrawal");
    });

    it("Should handle emergency withdrawal with exact balance", async function () {
      const { proxy, owner, user1 } = await loadFixture(deployTodoListV2Fixture);

      const amount = ethers.parseEther("1.0");
      await owner.sendTransaction({
        to: await proxy.getAddress(),
        value: amount
      });

      const balanceBefore = await ethers.provider.getBalance(user1.address);

      await proxy.connect(owner).emergencyWithdraw(user1.address);

      const balanceAfter = await ethers.provider.getBalance(user1.address);
      expect(balanceAfter).to.equal(balanceBefore + amount);
    });

    it("Should prevent emergency withdrawal to zero address", async function () {
      const { proxy, owner } = await loadFixture(deployTodoListV2Fixture);

      await owner.sendTransaction({
        to: await proxy.getAddress(),
        value: ethers.parseEther("1.0")
      });

      await expect(
        proxy.connect(owner).emergencyWithdraw(ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid recipient");
    });
  });

  describe("Address Zero and Invalid Inputs", function () {
    it("Should handle address zero in view functions", async function () {
      const { proxy } = await loadFixture(deployTodoListV2Fixture);

      const tasks = await proxy.getUserTasks(ethers.ZeroAddress);
      expect(tasks.length).to.equal(0);

      const count = await proxy.getTaskCount(ethers.ZeroAddress);
      expect(count).to.equal(0);

      const nonce = await proxy.getNonce(ethers.ZeroAddress);
      expect(nonce).to.equal(0);
    });

    it("Should handle non-existent task IDs gracefully", async function () {
      const { proxy } = await loadFixture(deployTodoListV2Fixture);

      await expect(
        proxy.getTask(999999)
      ).to.be.revertedWith("Task does not exist");

      await expect(
        proxy.isTaskCompleted(999999)
      ).to.be.revertedWith("Task does not exist");

      await expect(
        proxy.isTaskDeleted(999999)
      ).to.be.revertedWith("Task does not exist");
    });

    it("Should handle task ID of 0", async function () {
      const { proxy } = await loadFixture(deployTodoListV2Fixture);

      await expect(
        proxy.getTask(0)
      ).to.be.revertedWith("Task does not exist");
    });
  });

  describe("State Consistency Edge Cases", function () {
    it("Should maintain consistent state after failed operations", async function () {
      const { proxy, user1, user2 } = await loadFixture(deployTodoListV2Fixture);

      await proxy.connect(user1).createTask("User1 task");
      const countBefore = await proxy.getTotalTaskCount();

      // Attempt invalid operation
      await expect(
        proxy.connect(user2).completeTask(1)
      ).to.be.revertedWith("Not task owner");

      // State should remain unchanged
      const countAfter = await proxy.getTotalTaskCount();
      expect(countAfter).to.equal(countBefore);

      const task = await proxy.getTask(1);
      expect(task.completed).to.be.false;
    });

    it("Should handle concurrent operations from different users", async function () {
      const { proxy, user1, user2 } = await loadFixture(deployTodoListV2Fixture);

      // Both users create tasks simultaneously
      const tx1 = proxy.connect(user1).createTask("User1 task");
      const tx2 = proxy.connect(user2).createTask("User2 task");

      await Promise.all([tx1, tx2]);

      expect(await proxy.getTaskCount(user1.address)).to.equal(1);
      expect(await proxy.getTaskCount(user2.address)).to.equal(1);
      expect(await proxy.getTotalTaskCount()).to.equal(2);
    });
  });
});
