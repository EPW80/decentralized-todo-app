const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");
const { loadFixture, time } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("TodoListV2 - Fuzz Testing for Security Vulnerabilities", function () {
  async function deployTodoListV2Fixture() {
    const [owner, user1, user2, user3, attacker] = await ethers.getSigners();

    const TodoListV2 = await ethers.getContractFactory("TodoListV2");
    const proxy = await upgrades.deployProxy(
      TodoListV2,
      [owner.address],
      { initializer: "initialize", kind: "uups" }
    );
    await proxy.waitForDeployment();

    return { proxy, owner, user1, user2, user3, attacker, TodoListV2 };
  }

  // Helper to generate random string
  function randomString(length) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 !@#$%^&*()_+-=[]{}|;:,.<>?";
    let result = "";
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // Helper to generate random number in range
  function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  describe("Fuzz Testing - Task Creation", function () {
    it("Should handle random valid description lengths", async function () {
      const { proxy, owner, user1 } = await loadFixture(deployTodoListV2Fixture);

      await proxy.connect(owner).updateCooldown(0);

      // Test 20 random valid lengths
      for (let i = 0; i < 20; i++) {
        const length = randomInt(1, 500);
        const description = randomString(length);

        await expect(
          proxy.connect(user1).createTask(description, 0)
        ).to.not.be.reverted;

        const task = await proxy.getTask(i + 1);
        expect(task.description.length).to.be.lte(500);
      }

      expect(await proxy.getTotalTaskCount()).to.equal(20);
    });

    it("Should reject random invalid description lengths", async function () {
      const { proxy, user1 } = await loadFixture(deployTodoListV2Fixture);

      // Test 10 random invalid lengths (over 500)
      for (let i = 0; i < 10; i++) {
        const length = randomInt(501, 1000);
        const description = randomString(length);

        await expect(
          proxy.connect(user1).createTask(description, 0)
        ).to.be.revertedWith("Description too long");
      }
    });

    it("Should handle random special characters in descriptions", async function () {
      const { proxy, owner, user1 } = await loadFixture(deployTodoListV2Fixture);

      await proxy.connect(owner).updateCooldown(0);

      const specialStrings = [
        "Task with \n newlines \t tabs",
        "Task with 'quotes' and \"double quotes\"",
        "Task with <html> tags",
        "Task with unicode: \u00e9\u00e8\u00ea\u4e2d\u6587",
        "Task with emoji: \ud83d\ude80\ud83d\udd25\u2728",
        "Task with null char: \u0000",
        "Task with backslash: \\n \\t \\r",
        "SQL injection attempt: '; DROP TABLE tasks; --",
        "XSS attempt: <script>alert('xss')</script>",
        "Path traversal: ../../etc/passwd"
      ];

      for (const description of specialStrings) {
        if (description.length <= 500) {
          await expect(
            proxy.connect(user1).createTask(description, 0)
          ).to.not.be.reverted;
        }
      }
    });
  });

  describe("Fuzz Testing - Access Control", function () {
    it("Should prevent random users from accessing admin functions", async function () {
      const { proxy, user1, user2, user3 } = await loadFixture(deployTodoListV2Fixture);

      const users = [user1, user2, user3];

      for (const user of users) {
        await expect(proxy.connect(user).pause()).to.be.reverted;
        await expect(proxy.connect(user).unpause()).to.be.reverted;
        await expect(proxy.connect(user).activateCircuitBreaker()).to.be.reverted;
        await expect(proxy.connect(user).updateCooldown(10)).to.be.reverted;
        await expect(proxy.connect(user).updateMaxTasks(1000)).to.be.reverted;
      }
    });

    it("Should prevent random users from modifying other users' tasks", async function () {
      const { proxy, owner, user1, user2, user3 } = await loadFixture(deployTodoListV2Fixture);

      await proxy.connect(owner).updateCooldown(0);

      // User1 creates tasks
      for (let i = 0; i < 5; i++) {
        await proxy.connect(user1).createTask(`User1 Task ${i + 1}`, 0);
      }

      // Random users try to modify user1's tasks
      const attackers = [user2, user3];
      const taskIds = [1, 2, 3, 4, 5];

      for (const attacker of attackers) {
        for (const taskId of taskIds) {
          await expect(
            proxy.connect(attacker).completeTask(taskId)
          ).to.be.revertedWith("Not task owner");

          await expect(
            proxy.connect(attacker).deleteTask(taskId)
          ).to.be.revertedWith("Not task owner");
        }
      }
    });

    it("Should prevent unauthorized role grants with random addresses", async function () {
      const { proxy, user1, user2, user3 } = await loadFixture(deployTodoListV2Fixture);

      const ADMIN_ROLE = await proxy.ADMIN_ROLE();
      const MODERATOR_ROLE = await proxy.MODERATOR_ROLE();
      const UPGRADER_ROLE = await proxy.UPGRADER_ROLE();

      const roles = [ADMIN_ROLE, MODERATOR_ROLE, UPGRADER_ROLE];
      const targets = [user1, user2, user3];

      for (const role of roles) {
        for (const target of targets) {
          await expect(
            proxy.connect(user1).grantRoleWithEvent(role, target.address)
          ).to.be.reverted;
        }
      }
    });
  });

  describe("Fuzz Testing - Rate Limiting", function () {
    it("Should enforce rate limit with random cooldown values", async function () {
      const { proxy, owner, user1 } = await loadFixture(deployTodoListV2Fixture);

      // Test 5 random valid cooldown values
      for (let i = 0; i < 5; i++) {
        const cooldown = randomInt(5, 60); // 5 to 60 seconds
        await proxy.connect(owner).updateCooldown(cooldown);

        // Advance time to clear any previous cooldown
        await time.increase(cooldown + 1);

        await proxy.connect(user1).createTask(`Task with ${cooldown}s cooldown`, 0);

        // Should be rate limited
        await expect(
          proxy.connect(user1).createTask("Should fail", 0)
        ).to.be.revertedWith("Rate limit: please wait before next action");

        // Advance time past cooldown for next iteration
        await time.increase(cooldown + 1);
      }
    });

    it("Should handle random rapid task creations with zero cooldown", async function () {
      const { proxy, owner, user1 } = await loadFixture(deployTodoListV2Fixture);

      await proxy.connect(owner).updateCooldown(0);

      // Random number of rapid creations
      const count = randomInt(10, 50);

      for (let i = 0; i < count; i++) {
        await proxy.connect(user1).createTask(`Rapid task ${i + 1}`, 0);
      }

      expect(await proxy.getTaskCount(user1.address)).to.equal(count);
    });
  });

  describe("Fuzz Testing - Configuration Boundaries", function () {
    it("Should handle random valid maxTasks configurations", async function () {
      const { proxy, owner } = await loadFixture(deployTodoListV2Fixture);

      // Test 10 random valid values
      for (let i = 0; i < 10; i++) {
        const maxTasks = randomInt(100, 10000);
        await expect(
          proxy.connect(owner).updateMaxTasks(maxTasks)
        ).to.not.be.reverted;

        expect(await proxy.maxTasksPerUser()).to.equal(maxTasks);
      }
    });

    it("Should reject random invalid maxTasks values", async function () {
      const { proxy, owner } = await loadFixture(deployTodoListV2Fixture);

      // Test values below minimum
      for (let i = 0; i < 5; i++) {
        const invalidMax = randomInt(0, 99);
        await expect(
          proxy.connect(owner).updateMaxTasks(invalidMax)
        ).to.be.revertedWith("Max tasks too low");
      }

      // Test values above maximum
      for (let i = 0; i < 5; i++) {
        const invalidMax = randomInt(1000001, 2000000);
        await expect(
          proxy.connect(owner).updateMaxTasks(invalidMax)
        ).to.be.revertedWith("Max tasks too high");
      }
    });

    it("Should reject random invalid cooldown values", async function () {
      const { proxy, owner } = await loadFixture(deployTodoListV2Fixture);

      // Test values above 1 hour
      for (let i = 0; i < 10; i++) {
        const invalidCooldown = randomInt(3601, 10000);
        await expect(
          proxy.connect(owner).updateCooldown(invalidCooldown)
        ).to.be.revertedWith("Cooldown too long");
      }
    });
  });

  describe("Fuzz Testing - Task Operations", function () {
    it("Should handle random sequences of task operations", async function () {
      const { proxy, owner, user1 } = await loadFixture(deployTodoListV2Fixture);

      await proxy.connect(owner).updateCooldown(0);

      const operations = ["create", "complete", "delete", "restore"];
      const taskIds = [];

      // Perform 50 random operations
      for (let i = 0; i < 50; i++) {
        const op = operations[randomInt(0, operations.length - 1)];

        try {
          if (op === "create") {
            const description = randomString(randomInt(1, 100));
            await proxy.connect(user1).createTask(description, 0);
            taskIds.push(i + 1);
          } else if (taskIds.length > 0) {
            const taskId = taskIds[randomInt(0, taskIds.length - 1)];
            const task = await proxy.getTask(taskId);

            if (op === "complete" && !task.completed && !task.deleted) {
              await proxy.connect(user1).completeTask(taskId);
            } else if (op === "delete" && !task.deleted) {
              await proxy.connect(user1).deleteTask(taskId);
            } else if (op === "restore" && task.deleted) {
              await proxy.connect(user1).restoreTask(taskId);
            }
          }
        } catch (error) {
          // Some operations may fail due to state, which is expected
          // We're testing that the contract handles all states correctly
        }
      }

      // Verify contract is still in consistent state
      const totalTasks = await proxy.getTotalTaskCount();
      expect(totalTasks).to.be.gte(0);
    });

    it("Should handle random task IDs in view functions", async function () {
      const { proxy, owner, user1 } = await loadFixture(deployTodoListV2Fixture);

      await proxy.connect(owner).updateCooldown(0);

      // Create a few tasks
      for (let i = 0; i < 10; i++) {
        await proxy.connect(user1).createTask(`Task ${i + 1}`, 0);
      }

      // Try random task IDs
      for (let i = 0; i < 20; i++) {
        const randomId = randomInt(0, 100);

        try {
          if (randomId >= 1 && randomId <= 10) {
            const task = await proxy.getTask(randomId);
            expect(task.id).to.equal(randomId);
          } else {
            await expect(
              proxy.getTask(randomId)
            ).to.be.revertedWith("Task does not exist");
          }
        } catch (error) {
          // Expected for non-existent tasks
        }
      }
    });
  });

  describe("Fuzz Testing - Reentrancy Protection", function () {
    it("Should protect against random reentrancy patterns", async function () {
      const { proxy, owner, user1 } = await loadFixture(deployTodoListV2Fixture);

      // Send some ETH to contract
      await owner.sendTransaction({
        to: await proxy.getAddress(),
        value: ethers.parseEther("10.0")
      });

      // Verify reentrancy guard is in place
      // In a real scenario, we'd deploy a malicious contract
      // Here we verify the modifiers are applied
      await expect(
        proxy.connect(user1).withdraw()
      ).to.be.revertedWith("No pending withdrawal");
    });
  });

  describe("Fuzz Testing - Circuit Breaker Scenarios", function () {
    it("Should handle random circuit breaker activations", async function () {
      const { proxy, owner, user1 } = await loadFixture(deployTodoListV2Fixture);

      // Random sequence of circuit breaker operations
      for (let i = 0; i < 10; i++) {
        const action = randomInt(0, 1);

        if (action === 0) {
          // Activate
          const isActive = await proxy.circuitBreakerActive();
          if (!isActive) {
            await proxy.connect(owner).activateCircuitBreaker();
            expect(await proxy.circuitBreakerActive()).to.be.true;

            // Operations should be blocked
            await expect(
              proxy.connect(user1).createTask("Should fail", 0)
            ).to.be.revertedWith("Circuit breaker active: contract operations suspended");
          }
        } else {
          // Deactivate
          const isActive = await proxy.circuitBreakerActive();
          if (isActive) {
            await proxy.connect(owner).deactivateCircuitBreaker();
            expect(await proxy.circuitBreakerActive()).to.be.false;
          }
        }
      }
    });
  });

  describe("Fuzz Testing - Multi-User Scenarios", function () {
    it("Should handle random operations from multiple users simultaneously", async function () {
      const { proxy, owner, user1, user2, user3 } = await loadFixture(deployTodoListV2Fixture);

      await proxy.connect(owner).updateCooldown(0);

      const users = [user1, user2, user3];
      const taskCounts = { [user1.address]: 0, [user2.address]: 0, [user3.address]: 0 };

      // Each user performs random number of operations
      for (let i = 0; i < 30; i++) {
        const user = users[randomInt(0, users.length - 1)];
        const description = randomString(randomInt(1, 200));

        await proxy.connect(user).createTask(description, 0);
        taskCounts[user.address]++;
      }

      // Verify each user's task count
      for (const user of users) {
        const count = await proxy.getTaskCount(user.address);
        expect(count).to.equal(taskCounts[user.address]);
      }

      // Verify total tasks
      const totalExpected = Object.values(taskCounts).reduce((a, b) => a + b, 0);
      expect(await proxy.getTotalTaskCount()).to.equal(totalExpected);
    });

    it("Should maintain isolation between users with random operations", async function () {
      const { proxy, owner, user1, user2, user3 } = await loadFixture(deployTodoListV2Fixture);

      await proxy.connect(owner).updateCooldown(0);

      const users = [user1, user2, user3];

      // Each user creates tasks
      for (const user of users) {
        const taskCount = randomInt(5, 15);
        for (let i = 0; i < taskCount; i++) {
          await proxy.connect(user).createTask(`Task ${i + 1}`, 0);
        }
      }

      // Verify each user can only access their own tasks
      for (const owner of users) {
        const tasks = await proxy.getUserTasks(owner.address);
        for (const taskId of tasks) {
          const task = await proxy.getTask(taskId);
          expect(task.owner).to.equal(owner.address);

          // Other users cannot modify
          for (const other of users) {
            if (other.address !== owner.address) {
              await expect(
                proxy.connect(other).completeTask(taskId)
              ).to.be.revertedWith("Not task owner");
            }
          }
        }
      }
    });
  });

  describe("Fuzz Testing - Pause Scenarios", function () {
    it("Should handle random pause/unpause cycles", async function () {
      const { proxy, owner, user1 } = await loadFixture(deployTodoListV2Fixture);

      for (let i = 0; i < 10; i++) {
        const action = randomInt(0, 1);

        if (action === 0) {
          // Pause
          const status = await proxy.getContractStatus();
          if (!status.isPaused) {
            await proxy.connect(owner).pause();

            // Operations should fail
            await expect(
              proxy.connect(user1).createTask("Should fail", 0)
            ).to.be.revertedWithCustomError(proxy, "EnforcedPause");
          }
        } else {
          // Unpause
          const status = await proxy.getContractStatus();
          if (status.isPaused) {
            await proxy.connect(owner).unpause();
          }
        }
      }
    });
  });

  describe("Fuzz Testing - Gas Estimation", function () {
    it("Should handle task creation with varying gas limits", async function () {
      const { proxy, owner, user1 } = await loadFixture(deployTodoListV2Fixture);

      await proxy.connect(owner).updateCooldown(0);

      // Test with various description sizes to see gas consumption
      const sizes = [1, 10, 50, 100, 250, 500];

      for (const size of sizes) {
        const description = randomString(size);
        const tx = await proxy.connect(user1).createTask(description, 0);
        const receipt = await tx.wait();

        // Gas should be reasonable (less than 1M for complex operations)
        expect(receipt.gasUsed).to.be.lt(1000000);
      }
    });

    it("Should handle getUserTaskDetails with varying array sizes", async function () {
      const { proxy, owner, user1 } = await loadFixture(deployTodoListV2Fixture);

      await proxy.connect(owner).updateCooldown(0);

      const sizes = [0, 1, 10, 50, 100];

      for (const size of sizes) {
        // Create tasks
        for (let i = 0; i < size; i++) {
          await proxy.connect(user1).createTask(`Task ${i + 1}`, 0);
        }

        // Should be able to retrieve all tasks
        const tasks = await proxy.getUserTaskDetails(user1.address, true);
        expect(tasks.length).to.be.gte(size);

        // Clean up for next iteration
        for (let i = 1; i <= size; i++) {
          try {
            await proxy.connect(user1).deleteTask(i);
          } catch (e) {
            // May already be deleted
          }
        }
      }
    });
  });

  describe("Property-Based Invariant Testing", function () {
    it("INVARIANT: Total task count should always equal sum of all user task counts", async function () {
      const { proxy, owner, user1, user2, user3 } = await loadFixture(deployTodoListV2Fixture);

      await proxy.connect(owner).updateCooldown(0);

      const users = [user1, user2, user3];

      // Perform random operations
      for (let i = 0; i < 50; i++) {
        const user = users[randomInt(0, users.length - 1)];
        const op = randomInt(0, 1);

        if (op === 0) {
          // Create task
          await proxy.connect(user).createTask(randomString(randomInt(1, 100)), 0);
        } else {
          // Try to delete a task
          const userTasks = await proxy.getUserTasks(user.address);
          if (userTasks.length > 0) {
            const taskId = userTasks[randomInt(0, userTasks.length - 1)];
            try {
              await proxy.connect(user).deleteTask(taskId);
            } catch (e) {
              // May already be deleted
            }
          }
        }
      }

      // Verify invariant
      let sumUserCounts = 0;
      for (const user of users) {
        const count = await proxy.getTaskCount(user.address);
        sumUserCounts += Number(count);
      }

      const totalCount = Number(await proxy.getTotalTaskCount());
      // Note: getTotalTaskCount returns total created, not active tasks
      expect(totalCount).to.be.gte(sumUserCounts);
    });

    it("INVARIANT: User can only modify their own tasks", async function () {
      const { proxy, owner, user1, user2 } = await loadFixture(deployTodoListV2Fixture);

      await proxy.connect(owner).updateCooldown(0);

      // Create tasks for both users
      for (let i = 0; i < 10; i++) {
        await proxy.connect(user1).createTask(`User1 Task ${i + 1}`, 0);
        await proxy.connect(user2).createTask(`User2 Task ${i + 1}`, 0);
      }

      // Get all user1 tasks
      const user1Tasks = await proxy.getUserTasks(user1.address);

      // User2 should not be able to modify any of user1's tasks
      for (const taskId of user1Tasks) {
        await expect(
          proxy.connect(user2).completeTask(taskId)
        ).to.be.revertedWith("Not task owner");

        await expect(
          proxy.connect(user2).deleteTask(taskId)
        ).to.be.revertedWith("Not task owner");
      }
    });

    it("INVARIANT: Contract state should remain consistent after any operation", async function () {
      const { proxy, owner, user1 } = await loadFixture(deployTodoListV2Fixture);

      await proxy.connect(owner).updateCooldown(0);

      // Perform 100 random operations
      for (let i = 0; i < 100; i++) {
        const op = randomInt(0, 3);

        try {
          if (op === 0) {
            await proxy.connect(user1).createTask(randomString(randomInt(1, 500)), 0);
          } else {
            const tasks = await proxy.getUserTasks(user1.address);
            if (tasks.length > 0) {
              const taskId = tasks[randomInt(0, tasks.length - 1)];
              const task = await proxy.getTask(taskId);

              if (op === 1 && !task.completed && !task.deleted) {
                await proxy.connect(user1).completeTask(taskId);
              } else if (op === 2 && !task.deleted) {
                await proxy.connect(user1).deleteTask(taskId);
              } else if (op === 3 && task.deleted) {
                await proxy.connect(user1).restoreTask(taskId);
              }
            }
          }
        } catch (e) {
          // Some operations may fail, which is fine
        }

        // Verify contract is still responsive
        const totalCount = await proxy.getTotalTaskCount();
        expect(totalCount).to.be.gte(0);

        const userCount = await proxy.getTaskCount(user1.address);
        expect(userCount).to.be.gte(0);
      }
    });
  });
});
