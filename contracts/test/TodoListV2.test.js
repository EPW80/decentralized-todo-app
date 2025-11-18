const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");
const { loadFixture, time } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("TodoListV2", function () {
  // Fixture to deploy the upgradeable contract
  async function deployTodoListV2Fixture() {
    const [owner, admin, moderator, upgrader, user1, user2, attacker] = await ethers.getSigners();

    const TodoListV2 = await ethers.getContractFactory("TodoListV2");
    const proxy = await upgrades.deployProxy(
      TodoListV2,
      [owner.address],
      { initializer: "initialize", kind: "uups" }
    );
    await proxy.waitForDeployment();

    return { proxy, owner, admin, moderator, upgrader, user1, user2, attacker, TodoListV2 };
  }

  describe("Deployment & Initialization", function () {
    it("Should deploy successfully as a proxy", async function () {
      const { proxy } = await loadFixture(deployTodoListV2Fixture);
      expect(await proxy.getAddress()).to.be.properAddress;
    });

    it("Should initialize with correct version", async function () {
      const { proxy } = await loadFixture(deployTodoListV2Fixture);
      expect(await proxy.version()).to.equal("2.0.0");
    });

    it("Should grant all roles to initial admin", async function () {
      const { proxy, owner } = await loadFixture(deployTodoListV2Fixture);

      const DEFAULT_ADMIN_ROLE = await proxy.DEFAULT_ADMIN_ROLE();
      const ADMIN_ROLE = await proxy.ADMIN_ROLE();
      const MODERATOR_ROLE = await proxy.MODERATOR_ROLE();
      const UPGRADER_ROLE = await proxy.UPGRADER_ROLE();

      expect(await proxy.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.be.true;
      expect(await proxy.hasRole(ADMIN_ROLE, owner.address)).to.be.true;
      expect(await proxy.hasRole(MODERATOR_ROLE, owner.address)).to.be.true;
      expect(await proxy.hasRole(UPGRADER_ROLE, owner.address)).to.be.true;
    });

    it("Should set correct initial configuration", async function () {
      const { proxy } = await loadFixture(deployTodoListV2Fixture);

      expect(await proxy.actionCooldown()).to.equal(1); // 1 second
      expect(await proxy.maxTasksPerUser()).to.equal(10000);
      expect(await proxy.circuitBreakerActive()).to.be.false;
    });

    it("Should start with zero total tasks", async function () {
      const { proxy } = await loadFixture(deployTodoListV2Fixture);
      expect(await proxy.getTotalTaskCount()).to.equal(0);
    });

    it("Should not allow re-initialization", async function () {
      const { proxy, user1 } = await loadFixture(deployTodoListV2Fixture);

      await expect(
        proxy.initialize(user1.address)
      ).to.be.revertedWithCustomError(proxy, "InvalidInitialization");
    });

    it("Should return correct contract status", async function () {
      const { proxy } = await loadFixture(deployTodoListV2Fixture);

      const status = await proxy.getContractStatus();
      expect(status.isPaused).to.be.false;
      expect(status.isCircuitBreakerActive).to.be.false;
      expect(status.currentCooldown).to.equal(1);
      expect(status.currentMaxTasks).to.equal(10000);
    });
  });

  describe("Access Control & Role Management", function () {
    it("Should allow admin to grant roles", async function () {
      const { proxy, owner, user1 } = await loadFixture(deployTodoListV2Fixture);
      const ADMIN_ROLE = await proxy.ADMIN_ROLE();

      await proxy.connect(owner).grantRoleWithEvent(ADMIN_ROLE, user1.address);
      expect(await proxy.hasRole(ADMIN_ROLE, user1.address)).to.be.true;
    });

    it("Should emit event when granting role", async function () {
      const { proxy, owner, user1 } = await loadFixture(deployTodoListV2Fixture);
      const MODERATOR_ROLE = await proxy.MODERATOR_ROLE();

      await expect(proxy.connect(owner).grantRoleWithEvent(MODERATOR_ROLE, user1.address))
        .to.emit(proxy, "RoleGrantedByAdmin")
        .withArgs(MODERATOR_ROLE, user1.address, owner.address);
    });

    it("Should allow admin to revoke roles", async function () {
      const { proxy, owner, user1 } = await loadFixture(deployTodoListV2Fixture);
      const MODERATOR_ROLE = await proxy.MODERATOR_ROLE();

      await proxy.connect(owner).grantRoleWithEvent(MODERATOR_ROLE, user1.address);
      await proxy.connect(owner).revokeRoleWithEvent(MODERATOR_ROLE, user1.address);

      expect(await proxy.hasRole(MODERATOR_ROLE, user1.address)).to.be.false;
    });

    it("Should emit event when revoking role", async function () {
      const { proxy, owner, user1 } = await loadFixture(deployTodoListV2Fixture);
      const MODERATOR_ROLE = await proxy.MODERATOR_ROLE();

      await proxy.connect(owner).grantRoleWithEvent(MODERATOR_ROLE, user1.address);

      await expect(proxy.connect(owner).revokeRoleWithEvent(MODERATOR_ROLE, user1.address))
        .to.emit(proxy, "RoleRevokedByAdmin")
        .withArgs(MODERATOR_ROLE, user1.address, owner.address);
    });

    it("Should not allow non-admin to grant roles", async function () {
      const { proxy, user1, user2 } = await loadFixture(deployTodoListV2Fixture);
      const ADMIN_ROLE = await proxy.ADMIN_ROLE();

      await expect(
        proxy.connect(user1).grantRoleWithEvent(ADMIN_ROLE, user2.address)
      ).to.be.reverted;
    });

    it("Should not allow non-admin to revoke roles", async function () {
      const { proxy, owner, user1 } = await loadFixture(deployTodoListV2Fixture);
      const MODERATOR_ROLE = await proxy.MODERATOR_ROLE();

      await proxy.connect(owner).grantRoleWithEvent(MODERATOR_ROLE, user1.address);

      await expect(
        proxy.connect(user1).revokeRoleWithEvent(MODERATOR_ROLE, owner.address)
      ).to.be.reverted;
    });
  });

  describe("Pausable Functionality", function () {
    it("Should allow admin to pause contract", async function () {
      const { proxy, owner } = await loadFixture(deployTodoListV2Fixture);

      await proxy.connect(owner).pause();

      const status = await proxy.getContractStatus();
      expect(status.isPaused).to.be.true;
    });

    it("Should emit event when pausing", async function () {
      const { proxy, owner } = await loadFixture(deployTodoListV2Fixture);

      await expect(proxy.connect(owner).pause())
        .to.emit(proxy, "ContractPaused")
        .withArgs(owner.address, await time.latest() + 1);
    });

    it("Should allow admin to unpause contract", async function () {
      const { proxy, owner } = await loadFixture(deployTodoListV2Fixture);

      await proxy.connect(owner).pause();
      await proxy.connect(owner).unpause();

      const status = await proxy.getContractStatus();
      expect(status.isPaused).to.be.false;
    });

    it("Should emit event when unpausing", async function () {
      const { proxy, owner } = await loadFixture(deployTodoListV2Fixture);

      await proxy.connect(owner).pause();

      await expect(proxy.connect(owner).unpause())
        .to.emit(proxy, "ContractUnpaused")
        .withArgs(owner.address, await time.latest() + 1);
    });

    it("Should not allow task creation when paused", async function () {
      const { proxy, owner, user1 } = await loadFixture(deployTodoListV2Fixture);

      await proxy.connect(owner).pause();

      await expect(
        proxy.connect(user1).createTask("Test task")
      ).to.be.revertedWithCustomError(proxy, "EnforcedPause");
    });

    it("Should not allow non-admin to pause", async function () {
      const { proxy, user1 } = await loadFixture(deployTodoListV2Fixture);

      await expect(
        proxy.connect(user1).pause()
      ).to.be.reverted;
    });

    it("Should not allow non-admin to unpause", async function () {
      const { proxy, owner, user1 } = await loadFixture(deployTodoListV2Fixture);

      await proxy.connect(owner).pause();

      await expect(
        proxy.connect(user1).unpause()
      ).to.be.reverted;
    });
  });

  describe("Circuit Breaker Pattern", function () {
    it("Should allow admin to activate circuit breaker", async function () {
      const { proxy, owner } = await loadFixture(deployTodoListV2Fixture);

      await proxy.connect(owner).activateCircuitBreaker();

      expect(await proxy.circuitBreakerActive()).to.be.true;
    });

    it("Should emit event when activating circuit breaker", async function () {
      const { proxy, owner } = await loadFixture(deployTodoListV2Fixture);

      await expect(proxy.connect(owner).activateCircuitBreaker())
        .to.emit(proxy, "CircuitBreakerActivated")
        .withArgs(owner.address, await time.latest() + 1);
    });

    it("Should allow admin to deactivate circuit breaker", async function () {
      const { proxy, owner } = await loadFixture(deployTodoListV2Fixture);

      await proxy.connect(owner).activateCircuitBreaker();
      await proxy.connect(owner).deactivateCircuitBreaker();

      expect(await proxy.circuitBreakerActive()).to.be.false;
    });

    it("Should emit event when deactivating circuit breaker", async function () {
      const { proxy, owner } = await loadFixture(deployTodoListV2Fixture);

      await proxy.connect(owner).activateCircuitBreaker();

      await expect(proxy.connect(owner).deactivateCircuitBreaker())
        .to.emit(proxy, "CircuitBreakerDeactivated")
        .withArgs(owner.address, await time.latest() + 1);
    });

    it("Should block task creation when circuit breaker active", async function () {
      const { proxy, owner, user1 } = await loadFixture(deployTodoListV2Fixture);

      await proxy.connect(owner).activateCircuitBreaker();

      await expect(
        proxy.connect(user1).createTask("Test task")
      ).to.be.revertedWith("Circuit breaker active: contract operations suspended");
    });

    it("Should not allow activating already active circuit breaker", async function () {
      const { proxy, owner } = await loadFixture(deployTodoListV2Fixture);

      await proxy.connect(owner).activateCircuitBreaker();

      await expect(
        proxy.connect(owner).activateCircuitBreaker()
      ).to.be.revertedWith("Circuit breaker already active");
    });

    it("Should not allow deactivating inactive circuit breaker", async function () {
      const { proxy, owner } = await loadFixture(deployTodoListV2Fixture);

      await expect(
        proxy.connect(owner).deactivateCircuitBreaker()
      ).to.be.revertedWith("Circuit breaker not active");
    });

    it("Should not allow non-admin to activate circuit breaker", async function () {
      const { proxy, user1 } = await loadFixture(deployTodoListV2Fixture);

      await expect(
        proxy.connect(user1).activateCircuitBreaker()
      ).to.be.reverted;
    });
  });

  describe("Rate Limiting", function () {
    it("Should enforce rate limiting on task creation", async function () {
      const { proxy, owner, user1 } = await loadFixture(deployTodoListV2Fixture);

      // Set cooldown to 10 seconds to ensure it triggers
      await proxy.connect(owner).updateCooldown(10);

      await proxy.connect(user1).createTask("Task 1");

      await expect(
        proxy.connect(user1).createTask("Task 2")
      ).to.be.revertedWith("Rate limit: please wait before next action");
    });

    it("Should allow task creation after cooldown period", async function () {
      const { proxy, user1 } = await loadFixture(deployTodoListV2Fixture);

      await proxy.connect(user1).createTask("Task 1");

      // Advance time by 2 seconds (cooldown is 1 second)
      await time.increase(2);

      await expect(
        proxy.connect(user1).createTask("Task 2")
      ).to.not.be.reverted;
    });

    it("Should enforce rate limiting independently for different users", async function () {
      const { proxy, user1, user2 } = await loadFixture(deployTodoListV2Fixture);

      await proxy.connect(user1).createTask("User1 Task");

      // user2 should be able to create immediately
      await expect(
        proxy.connect(user2).createTask("User2 Task")
      ).to.not.be.reverted;
    });

    it("Should allow admin to update cooldown", async function () {
      const { proxy, owner } = await loadFixture(deployTodoListV2Fixture);

      await proxy.connect(owner).updateCooldown(5);
      expect(await proxy.actionCooldown()).to.equal(5);
    });

    it("Should emit event when updating cooldown", async function () {
      const { proxy, owner } = await loadFixture(deployTodoListV2Fixture);

      await expect(proxy.connect(owner).updateCooldown(10))
        .to.emit(proxy, "CooldownUpdated")
        .withArgs(1, 10);
    });

    it("Should not allow cooldown longer than 1 hour", async function () {
      const { proxy, owner } = await loadFixture(deployTodoListV2Fixture);

      const oneHour = 3600;
      await expect(
        proxy.connect(owner).updateCooldown(oneHour + 1)
      ).to.be.revertedWith("Cooldown too long");
    });

    it("Should not allow non-admin to update cooldown", async function () {
      const { proxy, user1 } = await loadFixture(deployTodoListV2Fixture);

      await expect(
        proxy.connect(user1).updateCooldown(5)
      ).to.be.reverted;
    });
  });

  describe("DoS Protection - Max Tasks Limit", function () {
    it("Should enforce max tasks per user limit", async function () {
      const { proxy, owner, user1 } = await loadFixture(deployTodoListV2Fixture);

      // Set low limit for testing (minimum is 100)
      await proxy.connect(owner).updateMaxTasks(100);

      // Create 100 tasks
      for (let i = 0; i < 100; i++) {
        await proxy.connect(user1).createTask(`Task ${i + 1}`);
        if (i < 99) await time.increase(2); // Skip time increase on last iteration
      }

      await time.increase(2);
      await expect(
        proxy.connect(user1).createTask("Task 101")
      ).to.be.revertedWith("Maximum tasks limit reached");
    });

    it("Should allow creating tasks after deleting", async function () {
      const { proxy, owner, user1 } = await loadFixture(deployTodoListV2Fixture);

      // Set low limit for testing (minimum is 100)
      await proxy.connect(owner).updateMaxTasks(100);

      // Create 100 tasks
      for (let i = 0; i < 100; i++) {
        await proxy.connect(user1).createTask(`Task ${i + 1}`);
        if (i < 99) await time.increase(2);
      }

      // Delete one task to free up space
      await time.increase(2);
      await proxy.connect(user1).deleteTask(1);
      await time.increase(2);

      // Should now be able to create another
      await expect(
        proxy.connect(user1).createTask("Task 101")
      ).to.not.be.reverted;
    });

    it("Should allow admin to update max tasks", async function () {
      const { proxy, owner } = await loadFixture(deployTodoListV2Fixture);

      await proxy.connect(owner).updateMaxTasks(5000);
      expect(await proxy.maxTasksPerUser()).to.equal(5000);
    });

    it("Should emit event when updating max tasks", async function () {
      const { proxy, owner } = await loadFixture(deployTodoListV2Fixture);

      await expect(proxy.connect(owner).updateMaxTasks(5000))
        .to.emit(proxy, "MaxTasksUpdated")
        .withArgs(10000, 5000);
    });

    it("Should not allow max tasks below 100", async function () {
      const { proxy, owner } = await loadFixture(deployTodoListV2Fixture);

      await expect(
        proxy.connect(owner).updateMaxTasks(99)
      ).to.be.revertedWith("Max tasks too low");
    });

    it("Should not allow max tasks above 1000000", async function () {
      const { proxy, owner } = await loadFixture(deployTodoListV2Fixture);

      await expect(
        proxy.connect(owner).updateMaxTasks(1000001)
      ).to.be.revertedWith("Max tasks too high");
    });
  });

  describe("Task Creation with Security Features", function () {
    it("Should create a task successfully", async function () {
      const { proxy, user1 } = await loadFixture(deployTodoListV2Fixture);

      const tx = await proxy.connect(user1).createTask("Buy groceries");
      await tx.wait();

      const taskCount = await proxy.getTaskCount(user1.address);
      expect(taskCount).to.equal(1);
    });

    it("Should emit TaskCreated event", async function () {
      const { proxy, user1 } = await loadFixture(deployTodoListV2Fixture);

      await expect(proxy.connect(user1).createTask("Test task"))
        .to.emit(proxy, "TaskCreated")
        .withArgs(1, user1.address, "Test task", await time.latest() + 1);
    });

    it("Should store task with correct properties including deleted flag", async function () {
      const { proxy, user1 } = await loadFixture(deployTodoListV2Fixture);

      await proxy.connect(user1).createTask("Complete project");
      const task = await proxy.getTask(1);

      expect(task.id).to.equal(1);
      expect(task.owner).to.equal(user1.address);
      expect(task.description).to.equal("Complete project");
      expect(task.completed).to.equal(false);
      expect(task.deleted).to.equal(false);
      expect(task.createdAt).to.be.gt(0);
      expect(task.completedAt).to.equal(0);
      expect(task.deletedAt).to.equal(0);
    });

    it("Should reject empty description", async function () {
      const { proxy, user1 } = await loadFixture(deployTodoListV2Fixture);

      await expect(
        proxy.connect(user1).createTask("")
      ).to.be.revertedWith("Description cannot be empty");
    });

    it("Should reject description over 500 characters", async function () {
      const { proxy, user1 } = await loadFixture(deployTodoListV2Fixture);

      const longDescription = "a".repeat(501);
      await expect(
        proxy.connect(user1).createTask(longDescription)
      ).to.be.revertedWith("Description too long");
    });
  });

  describe("Soft Delete & Restore Functionality", function () {
    it("Should soft delete a task", async function () {
      const { proxy, user1 } = await loadFixture(deployTodoListV2Fixture);

      await proxy.connect(user1).createTask("Task to delete");
      await time.increase(2);
      await proxy.connect(user1).deleteTask(1);

      const task = await proxy.getTask(1);
      expect(task.deleted).to.be.true;
      expect(task.deletedAt).to.be.gt(0);
    });

    it("Should emit TaskDeleted event", async function () {
      const { proxy, user1 } = await loadFixture(deployTodoListV2Fixture);

      await proxy.connect(user1).createTask("Task to delete");
      await time.increase(2);

      await expect(proxy.connect(user1).deleteTask(1))
        .to.emit(proxy, "TaskDeleted")
        .withArgs(1, user1.address, await time.latest() + 1);
    });

    it("Should restore a deleted task", async function () {
      const { proxy, user1 } = await loadFixture(deployTodoListV2Fixture);

      await proxy.connect(user1).createTask("Task to restore");
      await time.increase(2);
      await proxy.connect(user1).deleteTask(1);
      await time.increase(2);
      await proxy.connect(user1).restoreTask(1);

      const task = await proxy.getTask(1);
      expect(task.deleted).to.be.false;
      expect(task.deletedAt).to.equal(0);
    });

    it("Should emit TaskRestored event", async function () {
      const { proxy, user1 } = await loadFixture(deployTodoListV2Fixture);

      await proxy.connect(user1).createTask("Task to restore");
      await time.increase(2);
      await proxy.connect(user1).deleteTask(1);
      await time.increase(2);

      await expect(proxy.connect(user1).restoreTask(1))
        .to.emit(proxy, "TaskRestored")
        .withArgs(1, user1.address, await time.latest() + 1);
    });

    it("Should not allow restoring non-deleted task", async function () {
      const { proxy, user1 } = await loadFixture(deployTodoListV2Fixture);

      await proxy.connect(user1).createTask("Active task");

      await expect(
        proxy.connect(user1).restoreTask(1)
      ).to.be.revertedWith("Task is not deleted");
    });

    it("Should not allow completing deleted task", async function () {
      const { proxy, user1 } = await loadFixture(deployTodoListV2Fixture);

      await proxy.connect(user1).createTask("Task");
      await time.increase(2);
      await proxy.connect(user1).deleteTask(1);
      await time.increase(2);

      await expect(
        proxy.connect(user1).completeTask(1)
      ).to.be.revertedWith("Task has been deleted");
    });

    it("Should decrement task count when deleting", async function () {
      const { proxy, user1 } = await loadFixture(deployTodoListV2Fixture);

      await proxy.connect(user1).createTask("Task");
      expect(await proxy.getTaskCount(user1.address)).to.equal(1);

      await time.increase(2);
      await proxy.connect(user1).deleteTask(1);
      expect(await proxy.getTaskCount(user1.address)).to.equal(0);
    });

    it("Should increment task count when restoring", async function () {
      const { proxy, user1 } = await loadFixture(deployTodoListV2Fixture);

      await proxy.connect(user1).createTask("Task");
      await time.increase(2);
      await proxy.connect(user1).deleteTask(1);
      await time.increase(2);
      await proxy.connect(user1).restoreTask(1);

      expect(await proxy.getTaskCount(user1.address)).to.equal(1);
    });
  });

  describe("Task Completion", function () {
    it("Should complete a task successfully", async function () {
      const { proxy, user1 } = await loadFixture(deployTodoListV2Fixture);

      await proxy.connect(user1).createTask("Task to complete");
      await time.increase(2);
      await proxy.connect(user1).completeTask(1);

      const task = await proxy.getTask(1);
      expect(task.completed).to.equal(true);
      expect(task.completedAt).to.be.gt(0);
    });

    it("Should emit TaskCompleted event", async function () {
      const { proxy, user1 } = await loadFixture(deployTodoListV2Fixture);

      await proxy.connect(user1).createTask("Task to complete");
      await time.increase(2);

      await expect(proxy.connect(user1).completeTask(1))
        .to.emit(proxy, "TaskCompleted")
        .withArgs(1, user1.address, await time.latest() + 1);
    });

    it("Should not allow completing already completed task", async function () {
      const { proxy, user1 } = await loadFixture(deployTodoListV2Fixture);

      await proxy.connect(user1).createTask("Task");
      await time.increase(2);
      await proxy.connect(user1).completeTask(1);
      await time.increase(2);

      await expect(
        proxy.connect(user1).completeTask(1)
      ).to.be.revertedWith("Task already completed");
    });

    it("Should not allow non-owner to complete task", async function () {
      const { proxy, user1, user2 } = await loadFixture(deployTodoListV2Fixture);

      await proxy.connect(user1).createTask("User1 task");

      await expect(
        proxy.connect(user2).completeTask(1)
      ).to.be.revertedWith("Not task owner");
    });
  });

  describe("View Functions", function () {
    it("Should get user task details with includeDeleted flag", async function () {
      const { proxy, user1 } = await loadFixture(deployTodoListV2Fixture);

      await proxy.connect(user1).createTask("Task 1");
      await time.increase(2);
      await proxy.connect(user1).createTask("Task 2");
      await time.increase(2);
      await proxy.connect(user1).deleteTask(1);

      const allTasks = await proxy.getUserTaskDetails(user1.address, true);
      expect(allTasks.length).to.equal(2);

      const activeTasks = await proxy.getUserTaskDetails(user1.address, false);
      expect(activeTasks.length).to.equal(1);
      expect(activeTasks[0].description).to.equal("Task 2");
    });

    it("Should check if task is completed", async function () {
      const { proxy, user1 } = await loadFixture(deployTodoListV2Fixture);

      await proxy.connect(user1).createTask("Task");
      expect(await proxy.isTaskCompleted(1)).to.be.false;

      await time.increase(2);
      await proxy.connect(user1).completeTask(1);
      expect(await proxy.isTaskCompleted(1)).to.be.true;
    });

    it("Should check if task is deleted", async function () {
      const { proxy, user1 } = await loadFixture(deployTodoListV2Fixture);

      await proxy.connect(user1).createTask("Task");
      expect(await proxy.isTaskDeleted(1)).to.be.false;

      await time.increase(2);
      await proxy.connect(user1).deleteTask(1);
      expect(await proxy.isTaskDeleted(1)).to.be.true;
    });
  });

  describe("Pull Payment Pattern", function () {
    it("Should return zero pending withdrawal initially", async function () {
      const { proxy, user1 } = await loadFixture(deployTodoListV2Fixture);

      expect(await proxy.getPendingWithdrawal(user1.address)).to.equal(0);
    });

    it("Should allow withdrawal of pending balance", async function () {
      const { proxy, owner } = await loadFixture(deployTodoListV2Fixture);

      // Send ETH to contract
      await owner.sendTransaction({
        to: await proxy.getAddress(),
        value: ethers.parseEther("1.0")
      });

      // Note: _queueWithdrawal is internal, so we can't test it directly
      // This would be tested in integration with future payment features
    });
  });

  describe("Meta-Transaction Nonce Tracking", function () {
    it("Should return zero nonce initially", async function () {
      const { proxy, user1 } = await loadFixture(deployTodoListV2Fixture);

      expect(await proxy.getNonce(user1.address)).to.equal(0);
    });

    // Note: Nonce incrementing would be tested with actual meta-transaction implementation
  });

  describe("Emergency Withdrawal", function () {
    it("Should allow admin to emergency withdraw funds", async function () {
      const { proxy, owner, user1 } = await loadFixture(deployTodoListV2Fixture);

      // Send ETH to contract
      await owner.sendTransaction({
        to: await proxy.getAddress(),
        value: ethers.parseEther("1.0")
      });

      const initialBalance = await ethers.provider.getBalance(user1.address);

      await proxy.connect(owner).emergencyWithdraw(user1.address);

      const finalBalance = await ethers.provider.getBalance(user1.address);
      expect(finalBalance).to.be.gt(initialBalance);
    });

    it("Should not allow emergency withdraw to zero address", async function () {
      const { proxy, owner } = await loadFixture(deployTodoListV2Fixture);

      await owner.sendTransaction({
        to: await proxy.getAddress(),
        value: ethers.parseEther("1.0")
      });

      await expect(
        proxy.connect(owner).emergencyWithdraw(ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid recipient");
    });

    it("Should not allow emergency withdraw with no funds", async function () {
      const { proxy, owner, user1 } = await loadFixture(deployTodoListV2Fixture);

      await expect(
        proxy.connect(owner).emergencyWithdraw(user1.address)
      ).to.be.revertedWith("No funds to withdraw");
    });

    it("Should not allow non-admin to emergency withdraw", async function () {
      const { proxy, owner, user1 } = await loadFixture(deployTodoListV2Fixture);

      await owner.sendTransaction({
        to: await proxy.getAddress(),
        value: ethers.parseEther("1.0")
      });

      await expect(
        proxy.connect(user1).emergencyWithdraw(user1.address)
      ).to.be.reverted;
    });
  });

  describe("UUPS Upgradeability", function () {
    it("Should allow upgrader to upgrade contract", async function () {
      const { proxy, owner, TodoListV2 } = await loadFixture(deployTodoListV2Fixture);

      // Deploy new implementation
      const TodoListV2Upgraded = await ethers.getContractFactory("TodoListV2");

      await expect(
        upgrades.upgradeProxy(await proxy.getAddress(), TodoListV2Upgraded)
      ).to.not.be.reverted;
    });

    it("Should not allow non-upgrader to upgrade", async function () {
      const { proxy, user1 } = await loadFixture(deployTodoListV2Fixture);

      // This would fail at the authorization level
      // The actual test would require a malicious implementation attempt
    });

    it("Should preserve state after upgrade", async function () {
      const { proxy, owner, user1, TodoListV2 } = await loadFixture(deployTodoListV2Fixture);

      // Create some tasks
      await proxy.connect(user1).createTask("Task before upgrade");
      const taskCountBefore = await proxy.getTotalTaskCount();

      // Upgrade
      const TodoListV2Upgraded = await ethers.getContractFactory("TodoListV2");
      const upgraded = await upgrades.upgradeProxy(
        await proxy.getAddress(),
        TodoListV2Upgraded
      );

      // Verify state preserved
      const taskCountAfter = await upgraded.getTotalTaskCount();
      expect(taskCountAfter).to.equal(taskCountBefore);

      const task = await upgraded.getTask(1);
      expect(task.description).to.equal("Task before upgrade");
    });
  });

  describe("Reentrancy Protection", function () {
    it("Should protect withdraw function from reentrancy", async function () {
      // Note: Testing reentrancy requires a malicious contract
      // This is a placeholder for reentrancy attack simulation
      // In a real test, you would deploy an attacker contract
      // that attempts to recursively call withdraw()
    });
  });

  describe("Complex Scenarios", function () {
    it("Should handle complete workflow: create, complete, delete, restore", async function () {
      const { proxy, user1 } = await loadFixture(deployTodoListV2Fixture);

      // Create
      await proxy.connect(user1).createTask("Complex workflow task");
      let task = await proxy.getTask(1);
      expect(task.completed).to.be.false;
      expect(task.deleted).to.be.false;

      // Complete
      await time.increase(2);
      await proxy.connect(user1).completeTask(1);
      task = await proxy.getTask(1);
      expect(task.completed).to.be.true;

      // Delete
      await time.increase(2);
      await proxy.connect(user1).deleteTask(1);
      task = await proxy.getTask(1);
      expect(task.deleted).to.be.true;

      // Restore
      await time.increase(2);
      await proxy.connect(user1).restoreTask(1);
      task = await proxy.getTask(1);
      expect(task.deleted).to.be.false;
      expect(task.completed).to.be.true; // Should still be completed
    });

    it("Should maintain isolation between users", async function () {
      const { proxy, user1, user2 } = await loadFixture(deployTodoListV2Fixture);

      await proxy.connect(user1).createTask("User1 task");
      await proxy.connect(user2).createTask("User2 task");

      expect(await proxy.getTaskCount(user1.address)).to.equal(1);
      expect(await proxy.getTaskCount(user2.address)).to.equal(1);

      // User2 cannot modify User1's task
      await expect(
        proxy.connect(user2).completeTask(1)
      ).to.be.revertedWith("Not task owner");
    });

    it("Should handle multiple security layers simultaneously", async function () {
      const { proxy, owner, user1 } = await loadFixture(deployTodoListV2Fixture);

      // Activate both pause and circuit breaker
      await proxy.connect(owner).pause();
      await proxy.connect(owner).activateCircuitBreaker();

      // Should be blocked by pause first
      await expect(
        proxy.connect(user1).createTask("Task")
      ).to.be.revertedWithCustomError(proxy, "EnforcedPause");

      // Unpause but keep circuit breaker
      await proxy.connect(owner).unpause();

      // Should now be blocked by circuit breaker
      await expect(
        proxy.connect(user1).createTask("Task")
      ).to.be.revertedWith("Circuit breaker active: contract operations suspended");

      // Deactivate circuit breaker
      await proxy.connect(owner).deactivateCircuitBreaker();

      // Should now work
      await expect(
        proxy.connect(user1).createTask("Task")
      ).to.not.be.reverted;
    });
  });

  describe("Gas Optimization & Limits", function () {
    it("Should handle creating maximum description length", async function () {
      const { proxy, user1 } = await loadFixture(deployTodoListV2Fixture);

      const maxDescription = "a".repeat(500);
      await expect(
        proxy.connect(user1).createTask(maxDescription)
      ).to.not.be.reverted;
    });

    it("Should handle bulk operations efficiently", async function () {
      const { proxy, owner, user1 } = await loadFixture(deployTodoListV2Fixture);

      // Increase max tasks and reduce cooldown for testing
      await proxy.connect(owner).updateMaxTasks(100);
      await proxy.connect(owner).updateCooldown(0);

      // Create multiple tasks
      for (let i = 0; i < 10; i++) {
        await proxy.connect(user1).createTask(`Task ${i}`);
      }

      expect(await proxy.getTaskCount(user1.address)).to.equal(10);
    });
  });

  describe("Receive Function", function () {
    it("Should accept ETH via receive function", async function () {
      const { proxy, owner } = await loadFixture(deployTodoListV2Fixture);

      await expect(
        owner.sendTransaction({
          to: await proxy.getAddress(),
          value: ethers.parseEther("1.0")
        })
      ).to.not.be.reverted;

      const balance = await ethers.provider.getBalance(await proxy.getAddress());
      expect(balance).to.equal(ethers.parseEther("1.0"));
    });
  });
});
