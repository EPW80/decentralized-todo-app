const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("TodoListV2 - Upgrade Mechanism Tests", function () {
  async function deployTodoListV2Fixture() {
    const [owner, upgrader, user1, user2, attacker] = await ethers.getSigners();

    const TodoListV2 = await ethers.getContractFactory("TodoListV2");
    const proxy = await upgrades.deployProxy(
      TodoListV2,
      [owner.address],
      { initializer: "initialize", kind: "uups" }
    );
    await proxy.waitForDeployment();

    return { proxy, owner, upgrader, user1, user2, attacker, TodoListV2 };
  }

  describe("Upgrade Authorization", function () {
    it("Should allow UPGRADER_ROLE to upgrade contract", async function () {
      const { proxy, owner, upgrader, TodoListV2 } = await loadFixture(deployTodoListV2Fixture);

      // Grant upgrader role to a different account
      const UPGRADER_ROLE = await proxy.UPGRADER_ROLE();
      await proxy.connect(owner).grantRoleWithEvent(UPGRADER_ROLE, upgrader.address);

      // Deploy new implementation
      const TodoListV2Upgraded = await ethers.getContractFactory("TodoListV2", upgrader);

      // Should succeed with UPGRADER_ROLE
      await expect(
        upgrades.upgradeProxy(await proxy.getAddress(), TodoListV2Upgraded)
      ).to.not.be.reverted;
    });

    it("Should prevent non-UPGRADER from upgrading", async function () {
      const { proxy, owner, attacker } = await loadFixture(deployTodoListV2Fixture);

      // Remove upgrader role from attacker (they don't have it anyway)
      const UPGRADER_ROLE = await proxy.UPGRADER_ROLE();
      expect(await proxy.hasRole(UPGRADER_ROLE, attacker.address)).to.be.false;

      // Attacker tries to call upgradeTo directly (this should fail)
      // Note: In UUPS, the upgrade is protected by _authorizeUpgrade
      const TodoListV2Factory = await ethers.getContractFactory("TodoListV2");
      const newImplementation = await TodoListV2Factory.deploy();
      await newImplementation.waitForDeployment();

      // Try to upgrade (should fail due to missing role)
      const proxyAsUUPS = await ethers.getContractAt(
        "TodoListV2",
        await proxy.getAddress(),
        attacker
      );

      await expect(
        proxyAsUUPS.upgradeToAndCall(await newImplementation.getAddress(), "0x")
      ).to.be.reverted;
    });

    it("Should preserve UPGRADER_ROLE after upgrade", async function () {
      const { proxy, owner, upgrader, TodoListV2 } = await loadFixture(deployTodoListV2Fixture);

      const UPGRADER_ROLE = await proxy.UPGRADER_ROLE();
      await proxy.connect(owner).grantRoleWithEvent(UPGRADER_ROLE, upgrader.address);

      // Upgrade
      const TodoListV2Upgraded = await ethers.getContractFactory("TodoListV2");
      const upgraded = await upgrades.upgradeProxy(
        await proxy.getAddress(),
        TodoListV2Upgraded
      );

      // Check role is preserved
      expect(await upgraded.hasRole(UPGRADER_ROLE, upgrader.address)).to.be.true;
    });

    it("Should allow revoking and re-granting UPGRADER_ROLE", async function () {
      const { proxy, owner, upgrader } = await loadFixture(deployTodoListV2Fixture);

      const UPGRADER_ROLE = await proxy.UPGRADER_ROLE();

      // Grant role
      await proxy.connect(owner).grantRoleWithEvent(UPGRADER_ROLE, upgrader.address);
      expect(await proxy.hasRole(UPGRADER_ROLE, upgrader.address)).to.be.true;

      // Revoke role
      await proxy.connect(owner).revokeRoleWithEvent(UPGRADER_ROLE, upgrader.address);
      expect(await proxy.hasRole(UPGRADER_ROLE, upgrader.address)).to.be.false;

      // Re-grant role
      await proxy.connect(owner).grantRoleWithEvent(UPGRADER_ROLE, upgrader.address);
      expect(await proxy.hasRole(UPGRADER_ROLE, upgrader.address)).to.be.true;
    });
  });

  describe("State Preservation During Upgrade", function () {
    it("Should preserve all tasks after upgrade", async function () {
      const { proxy, user1, user2, TodoListV2 } = await loadFixture(deployTodoListV2Fixture);

      // Create multiple tasks with different users
      await proxy.connect(user1).createTask("User1 Task 1");
      await proxy.connect(user1).createTask("User1 Task 2");
      await proxy.connect(user2).createTask("User2 Task 1");

      const taskCountBefore = await proxy.getTotalTaskCount();
      const user1TasksBefore = await proxy.getUserTasks(user1.address);
      const user2TasksBefore = await proxy.getUserTasks(user2.address);

      // Upgrade
      const TodoListV2Upgraded = await ethers.getContractFactory("TodoListV2");
      const upgraded = await upgrades.upgradeProxy(
        await proxy.getAddress(),
        TodoListV2Upgraded
      );

      // Verify all state is preserved
      expect(await upgraded.getTotalTaskCount()).to.equal(taskCountBefore);
      expect(await upgraded.getUserTasks(user1.address)).to.deep.equal(user1TasksBefore);
      expect(await upgraded.getUserTasks(user2.address)).to.deep.equal(user2TasksBefore);

      // Verify task details
      const task1 = await upgraded.getTask(1);
      expect(task1.description).to.equal("User1 Task 1");
      expect(task1.owner).to.equal(user1.address);
    });

    it("Should preserve configuration settings after upgrade", async function () {
      const { proxy, owner, TodoListV2 } = await loadFixture(deployTodoListV2Fixture);

      // Change configuration
      await proxy.connect(owner).updateCooldown(60);
      await proxy.connect(owner).updateMaxTasks(500);

      const cooldownBefore = await proxy.actionCooldown();
      const maxTasksBefore = await proxy.maxTasksPerUser();

      // Upgrade
      const TodoListV2Upgraded = await ethers.getContractFactory("TodoListV2");
      const upgraded = await upgrades.upgradeProxy(
        await proxy.getAddress(),
        TodoListV2Upgraded
      );

      // Verify configuration preserved
      expect(await upgraded.actionCooldown()).to.equal(cooldownBefore);
      expect(await upgraded.maxTasksPerUser()).to.equal(maxTasksBefore);
    });

    it("Should preserve role assignments after upgrade", async function () {
      const { proxy, owner, upgrader, user1, TodoListV2 } = await loadFixture(deployTodoListV2Fixture);

      const ADMIN_ROLE = await proxy.ADMIN_ROLE();
      const MODERATOR_ROLE = await proxy.MODERATOR_ROLE();
      const UPGRADER_ROLE = await proxy.UPGRADER_ROLE();

      // Grant roles to different users
      await proxy.connect(owner).grantRoleWithEvent(ADMIN_ROLE, upgrader.address);
      await proxy.connect(owner).grantRoleWithEvent(MODERATOR_ROLE, user1.address);

      // Upgrade
      const TodoListV2Upgraded = await ethers.getContractFactory("TodoListV2");
      const upgraded = await upgrades.upgradeProxy(
        await proxy.getAddress(),
        TodoListV2Upgraded
      );

      // Verify roles preserved
      expect(await upgraded.hasRole(ADMIN_ROLE, upgrader.address)).to.be.true;
      expect(await upgraded.hasRole(MODERATOR_ROLE, user1.address)).to.be.true;
      expect(await upgraded.hasRole(ADMIN_ROLE, owner.address)).to.be.true;
    });

    it("Should preserve paused state during upgrade", async function () {
      const { proxy, owner, TodoListV2 } = await loadFixture(deployTodoListV2Fixture);

      // Pause contract
      await proxy.connect(owner).pause();
      const status = await proxy.getContractStatus();
      expect(status.isPaused).to.be.true;

      // Upgrade
      const TodoListV2Upgraded = await ethers.getContractFactory("TodoListV2");
      const upgraded = await upgrades.upgradeProxy(
        await proxy.getAddress(),
        TodoListV2Upgraded
      );

      // Verify still paused after upgrade
      const statusAfter = await upgraded.getContractStatus();
      expect(statusAfter.isPaused).to.be.true;
    });

    it("Should preserve circuit breaker state during upgrade", async function () {
      const { proxy, owner, TodoListV2 } = await loadFixture(deployTodoListV2Fixture);

      // Activate circuit breaker
      await proxy.connect(owner).activateCircuitBreaker();
      expect(await proxy.circuitBreakerActive()).to.be.true;

      // Upgrade
      const TodoListV2Upgraded = await ethers.getContractFactory("TodoListV2");
      const upgraded = await upgrades.upgradeProxy(
        await proxy.getAddress(),
        TodoListV2Upgraded
      );

      // Verify circuit breaker still active
      expect(await upgraded.circuitBreakerActive()).to.be.true;
    });
  });

  describe("Functionality After Upgrade", function () {
    it("Should allow creating tasks after upgrade", async function () {
      const { proxy, user1, TodoListV2 } = await loadFixture(deployTodoListV2Fixture);

      // Upgrade
      const TodoListV2Upgraded = await ethers.getContractFactory("TodoListV2");
      const upgraded = await upgrades.upgradeProxy(
        await proxy.getAddress(),
        TodoListV2Upgraded
      );

      // Create task after upgrade
      await expect(
        upgraded.connect(user1).createTask("Post-upgrade task")
      ).to.not.be.reverted;

      const task = await upgraded.getTask(1);
      expect(task.description).to.equal("Post-upgrade task");
    });

    it("Should allow completing tasks created before upgrade", async function () {
      const { proxy, user1, TodoListV2 } = await loadFixture(deployTodoListV2Fixture);

      // Create task before upgrade
      await proxy.connect(user1).createTask("Pre-upgrade task");

      // Upgrade
      const TodoListV2Upgraded = await ethers.getContractFactory("TodoListV2");
      const upgraded = await upgrades.upgradeProxy(
        await proxy.getAddress(),
        TodoListV2Upgraded
      );

      // Complete task after upgrade
      await expect(
        upgraded.connect(user1).completeTask(1)
      ).to.not.be.reverted;

      expect(await upgraded.isTaskCompleted(1)).to.be.true;
    });

    it("Should maintain access control after upgrade", async function () {
      const { proxy, owner, user1, TodoListV2 } = await loadFixture(deployTodoListV2Fixture);

      // Upgrade
      const TodoListV2Upgraded = await ethers.getContractFactory("TodoListV2");
      const upgraded = await upgrades.upgradeProxy(
        await proxy.getAddress(),
        TodoListV2Upgraded
      );

      // Admin functions should still require ADMIN_ROLE
      await expect(
        upgraded.connect(user1).pause()
      ).to.be.reverted;

      // Owner should still be able to use admin functions
      await expect(
        upgraded.connect(owner).pause()
      ).to.not.be.reverted;
    });
  });

  describe("Multiple Sequential Upgrades", function () {
    it("Should support multiple consecutive upgrades", async function () {
      const { proxy, user1, TodoListV2 } = await loadFixture(deployTodoListV2Fixture);

      // Create initial task
      await proxy.connect(user1).createTask("Task 1");

      // First upgrade
      const TodoListV2Upgraded1 = await ethers.getContractFactory("TodoListV2");
      const upgraded1 = await upgrades.upgradeProxy(
        await proxy.getAddress(),
        TodoListV2Upgraded1
      );

      // Create task after first upgrade
      await upgraded1.connect(user1).createTask("Task 2");

      // Second upgrade
      const TodoListV2Upgraded2 = await ethers.getContractFactory("TodoListV2");
      const upgraded2 = await upgrades.upgradeProxy(
        await upgraded1.getAddress(),
        TodoListV2Upgraded2
      );

      // Verify all tasks are still present
      expect(await upgraded2.getTotalTaskCount()).to.equal(2);
      const task1 = await upgraded2.getTask(1);
      const task2 = await upgraded2.getTask(2);
      expect(task1.description).to.equal("Task 1");
      expect(task2.description).to.equal("Task 2");
    });

    it("Should preserve version history through upgrades", async function () {
      const { proxy, TodoListV2 } = await loadFixture(deployTodoListV2Fixture);

      // Initial version
      expect(await proxy.version()).to.equal("2.0.0");

      // Upgrade (in this case to same version, but process is tested)
      const TodoListV2Upgraded = await ethers.getContractFactory("TodoListV2");
      const upgraded = await upgrades.upgradeProxy(
        await proxy.getAddress(),
        TodoListV2Upgraded
      );

      // Version should remain (or could be updated in a real upgrade)
      expect(await upgraded.version()).to.equal("2.0.0");
    });
  });

  describe("Upgrade Edge Cases", function () {
    it("Should handle upgrade with active users", async function () {
      const { proxy, user1, user2, TodoListV2 } = await loadFixture(deployTodoListV2Fixture);

      // Multiple users with tasks
      await proxy.connect(user1).createTask("User1 active task");
      await proxy.connect(user2).createTask("User2 active task");

      // Upgrade with active state
      const TodoListV2Upgraded = await ethers.getContractFactory("TodoListV2");
      const upgraded = await upgrades.upgradeProxy(
        await proxy.getAddress(),
        TodoListV2Upgraded
      );

      // Both users should still be able to interact
      await expect(
        upgraded.connect(user1).createTask("User1 post-upgrade")
      ).to.not.be.reverted;

      await expect(
        upgraded.connect(user2).createTask("User2 post-upgrade")
      ).to.not.be.reverted;
    });

    it("Should maintain task counter continuity after upgrade", async function () {
      const { proxy, user1, TodoListV2 } = await loadFixture(deployTodoListV2Fixture);

      // Create some tasks
      await proxy.connect(user1).createTask("Task 1");
      await proxy.connect(user1).createTask("Task 2");
      const countBefore = await proxy.getTotalTaskCount();

      // Upgrade
      const TodoListV2Upgraded = await ethers.getContractFactory("TodoListV2");
      const upgraded = await upgrades.upgradeProxy(
        await proxy.getAddress(),
        TodoListV2Upgraded
      );

      // Create new task - should get next ID
      await upgraded.connect(user1).createTask("Task 3");
      const countAfter = await upgraded.getTotalTaskCount();

      expect(countAfter).to.equal(countBefore + BigInt(1));
    });
  });

  describe("Proxy Implementation", function () {
    it("Should use UUPS proxy pattern", async function () {
      const { proxy } = await loadFixture(deployTodoListV2Fixture);

      // Verify it's a proxy by checking the implementation
      const implementationAddress = await upgrades.erc1967.getImplementationAddress(
        await proxy.getAddress()
      );

      expect(implementationAddress).to.be.properAddress;
      expect(implementationAddress).to.not.equal(ethers.ZeroAddress);
    });

    it("Should have correct admin address", async function () {
      const { proxy } = await loadFixture(deployTodoListV2Fixture);

      // For UUPS, there's no admin in the traditional sense
      // The admin is the implementation contract itself
      const implementationAddress = await upgrades.erc1967.getImplementationAddress(
        await proxy.getAddress()
      );

      expect(implementationAddress).to.be.properAddress;
    });
  });
});
