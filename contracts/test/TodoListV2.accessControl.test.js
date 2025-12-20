const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("TodoListV2 - Access Control with Multiple Roles", function () {
  async function deployTodoListV2Fixture() {
    const [owner, admin1, admin2, moderator1, moderator2, upgrader1, upgrader2, user1, user2] =
      await ethers.getSigners();

    const TodoListV2 = await ethers.getContractFactory("TodoListV2");
    const proxy = await upgrades.deployProxy(
      TodoListV2,
      [owner.address],
      { initializer: "initialize", kind: "uups" }
    );
    await proxy.waitForDeployment();

    return {
      proxy,
      owner,
      admin1,
      admin2,
      moderator1,
      moderator2,
      upgrader1,
      upgrader2,
      user1,
      user2,
      TodoListV2
    };
  }

  describe("Multiple Admins Scenario", function () {
    it("Should support multiple ADMIN_ROLE holders", async function () {
      const { proxy, owner, admin1, admin2 } = await loadFixture(deployTodoListV2Fixture);

      const ADMIN_ROLE = await proxy.ADMIN_ROLE();

      // Grant admin role to multiple users
      await proxy.connect(owner).grantRoleWithEvent(ADMIN_ROLE, admin1.address);
      await proxy.connect(owner).grantRoleWithEvent(ADMIN_ROLE, admin2.address);

      // Both should have admin role
      expect(await proxy.hasRole(ADMIN_ROLE, admin1.address)).to.be.true;
      expect(await proxy.hasRole(ADMIN_ROLE, admin2.address)).to.be.true;
    });

    it("Should allow any ADMIN to pause contract", async function () {
      const { proxy, owner, admin1, admin2 } = await loadFixture(deployTodoListV2Fixture);

      const ADMIN_ROLE = await proxy.ADMIN_ROLE();
      await proxy.connect(owner).grantRoleWithEvent(ADMIN_ROLE, admin1.address);
      await proxy.connect(owner).grantRoleWithEvent(ADMIN_ROLE, admin2.address);

      // Admin1 pauses
      await expect(proxy.connect(admin1).pause()).to.not.be.reverted;

      // Unpause
      await proxy.connect(owner).unpause();

      // Admin2 pauses
      await expect(proxy.connect(admin2).pause()).to.not.be.reverted;
    });

    it("Should allow any ADMIN to activate circuit breaker", async function () {
      const { proxy, owner, admin1, admin2 } = await loadFixture(deployTodoListV2Fixture);

      const ADMIN_ROLE = await proxy.ADMIN_ROLE();
      await proxy.connect(owner).grantRoleWithEvent(ADMIN_ROLE, admin1.address);
      await proxy.connect(owner).grantRoleWithEvent(ADMIN_ROLE, admin2.address);

      // Admin1 activates
      await expect(proxy.connect(admin1).activateCircuitBreaker()).to.not.be.reverted;

      // Admin2 deactivates
      await expect(proxy.connect(admin2).deactivateCircuitBreaker()).to.not.be.reverted;
    });

    it("Should allow any ADMIN to update configuration", async function () {
      const { proxy, owner, admin1, admin2 } = await loadFixture(deployTodoListV2Fixture);

      const ADMIN_ROLE = await proxy.ADMIN_ROLE();
      await proxy.connect(owner).grantRoleWithEvent(ADMIN_ROLE, admin1.address);
      await proxy.connect(owner).grantRoleWithEvent(ADMIN_ROLE, admin2.address);

      // Admin1 updates cooldown
      await expect(proxy.connect(admin1).updateCooldown(10)).to.not.be.reverted;

      // Admin2 updates max tasks
      await expect(proxy.connect(admin2).updateMaxTasks(5000)).to.not.be.reverted;
    });

    it("Should allow any ADMIN with DEFAULT_ADMIN_ROLE to grant/revoke other roles", async function () {
      const { proxy, owner, admin1, admin2, user1 } = await loadFixture(deployTodoListV2Fixture);

      const DEFAULT_ADMIN_ROLE = await proxy.DEFAULT_ADMIN_ROLE();
      const ADMIN_ROLE = await proxy.ADMIN_ROLE();
      const MODERATOR_ROLE = await proxy.MODERATOR_ROLE();

      // Grant both DEFAULT_ADMIN_ROLE and ADMIN_ROLE
      await proxy.connect(owner).grantRole(DEFAULT_ADMIN_ROLE, admin1.address);
      await proxy.connect(owner).grantRoleWithEvent(ADMIN_ROLE, admin1.address);
      await proxy.connect(owner).grantRole(DEFAULT_ADMIN_ROLE, admin2.address);
      await proxy.connect(owner).grantRoleWithEvent(ADMIN_ROLE, admin2.address);

      // Admin1 grants moderator role
      await expect(
        proxy.connect(admin1).grantRoleWithEvent(MODERATOR_ROLE, user1.address)
      ).to.not.be.reverted;

      // Admin2 revokes moderator role
      await expect(
        proxy.connect(admin2).revokeRoleWithEvent(MODERATOR_ROLE, user1.address)
      ).to.not.be.reverted;
    });
  });

  describe("Multiple Moderators Scenario", function () {
    it("Should support multiple MODERATOR_ROLE holders", async function () {
      const { proxy, owner, moderator1, moderator2 } = await loadFixture(deployTodoListV2Fixture);

      const MODERATOR_ROLE = await proxy.MODERATOR_ROLE();

      await proxy.connect(owner).grantRoleWithEvent(MODERATOR_ROLE, moderator1.address);
      await proxy.connect(owner).grantRoleWithEvent(MODERATOR_ROLE, moderator2.address);

      expect(await proxy.hasRole(MODERATOR_ROLE, moderator1.address)).to.be.true;
      expect(await proxy.hasRole(MODERATOR_ROLE, moderator2.address)).to.be.true;
    });

    it("Should not allow moderators to pause contract", async function () {
      const { proxy, owner, moderator1 } = await loadFixture(deployTodoListV2Fixture);

      const MODERATOR_ROLE = await proxy.MODERATOR_ROLE();
      await proxy.connect(owner).grantRoleWithEvent(MODERATOR_ROLE, moderator1.address);

      await expect(
        proxy.connect(moderator1).pause()
      ).to.be.reverted;
    });

    it("Should not allow moderators to activate circuit breaker", async function () {
      const { proxy, owner, moderator1 } = await loadFixture(deployTodoListV2Fixture);

      const MODERATOR_ROLE = await proxy.MODERATOR_ROLE();
      await proxy.connect(owner).grantRoleWithEvent(MODERATOR_ROLE, moderator1.address);

      await expect(
        proxy.connect(moderator1).activateCircuitBreaker()
      ).to.be.reverted;
    });

    it("Should not allow moderators to grant roles", async function () {
      const { proxy, owner, moderator1, user1 } = await loadFixture(deployTodoListV2Fixture);

      const MODERATOR_ROLE = await proxy.MODERATOR_ROLE();
      await proxy.connect(owner).grantRoleWithEvent(MODERATOR_ROLE, moderator1.address);

      await expect(
        proxy.connect(moderator1).grantRoleWithEvent(MODERATOR_ROLE, user1.address)
      ).to.be.reverted;
    });
  });

  describe("Multiple Upgraders Scenario", function () {
    it("Should support multiple UPGRADER_ROLE holders", async function () {
      const { proxy, owner, upgrader1, upgrader2 } = await loadFixture(deployTodoListV2Fixture);

      const UPGRADER_ROLE = await proxy.UPGRADER_ROLE();

      await proxy.connect(owner).grantRoleWithEvent(UPGRADER_ROLE, upgrader1.address);
      await proxy.connect(owner).grantRoleWithEvent(UPGRADER_ROLE, upgrader2.address);

      expect(await proxy.hasRole(UPGRADER_ROLE, upgrader1.address)).to.be.true;
      expect(await proxy.hasRole(UPGRADER_ROLE, upgrader2.address)).to.be.true;
    });

    it("Should allow any UPGRADER to perform upgrades", async function () {
      const { proxy, owner, upgrader1, TodoListV2 } = await loadFixture(deployTodoListV2Fixture);

      const UPGRADER_ROLE = await proxy.UPGRADER_ROLE();
      await proxy.connect(owner).grantRoleWithEvent(UPGRADER_ROLE, upgrader1.address);

      const TodoListV2Upgraded = await ethers.getContractFactory("TodoListV2", upgrader1);
      await expect(
        upgrades.upgradeProxy(await proxy.getAddress(), TodoListV2Upgraded)
      ).to.not.be.reverted;
    });

    it("Should not allow upgraders to pause contract", async function () {
      const { proxy, owner, upgrader1 } = await loadFixture(deployTodoListV2Fixture);

      const UPGRADER_ROLE = await proxy.UPGRADER_ROLE();
      await proxy.connect(owner).grantRoleWithEvent(UPGRADER_ROLE, upgrader1.address);

      await expect(
        proxy.connect(upgrader1).pause()
      ).to.be.reverted;
    });
  });

  describe("Overlapping Roles Scenario", function () {
    it("Should support user with multiple roles", async function () {
      const { proxy, owner, admin1 } = await loadFixture(deployTodoListV2Fixture);

      const ADMIN_ROLE = await proxy.ADMIN_ROLE();
      const MODERATOR_ROLE = await proxy.MODERATOR_ROLE();
      const UPGRADER_ROLE = await proxy.UPGRADER_ROLE();

      // Grant all roles to one user
      await proxy.connect(owner).grantRoleWithEvent(ADMIN_ROLE, admin1.address);
      await proxy.connect(owner).grantRoleWithEvent(MODERATOR_ROLE, admin1.address);
      await proxy.connect(owner).grantRoleWithEvent(UPGRADER_ROLE, admin1.address);

      expect(await proxy.hasRole(ADMIN_ROLE, admin1.address)).to.be.true;
      expect(await proxy.hasRole(MODERATOR_ROLE, admin1.address)).to.be.true;
      expect(await proxy.hasRole(UPGRADER_ROLE, admin1.address)).to.be.true;
    });

    it("Should allow user with multiple roles to perform all role functions", async function () {
      const { proxy, owner, admin1, TodoListV2 } = await loadFixture(deployTodoListV2Fixture);

      const ADMIN_ROLE = await proxy.ADMIN_ROLE();
      const UPGRADER_ROLE = await proxy.UPGRADER_ROLE();

      await proxy.connect(owner).grantRoleWithEvent(ADMIN_ROLE, admin1.address);
      await proxy.connect(owner).grantRoleWithEvent(UPGRADER_ROLE, admin1.address);

      // Admin function
      await expect(proxy.connect(admin1).pause()).to.not.be.reverted;
      await expect(proxy.connect(admin1).unpause()).to.not.be.reverted;

      // Upgrader function
      const TodoListV2Upgraded = await ethers.getContractFactory("TodoListV2");
      await expect(
        upgrades.upgradeProxy(await proxy.getAddress(), TodoListV2Upgraded)
      ).to.not.be.reverted;
    });

    it("Should allow selective role revocation without affecting other roles", async function () {
      const { proxy, owner, admin1 } = await loadFixture(deployTodoListV2Fixture);

      const ADMIN_ROLE = await proxy.ADMIN_ROLE();
      const MODERATOR_ROLE = await proxy.MODERATOR_ROLE();

      // Grant both roles
      await proxy.connect(owner).grantRoleWithEvent(ADMIN_ROLE, admin1.address);
      await proxy.connect(owner).grantRoleWithEvent(MODERATOR_ROLE, admin1.address);

      // Revoke only moderator role
      await proxy.connect(owner).revokeRoleWithEvent(MODERATOR_ROLE, admin1.address);

      // Admin role should still be active
      expect(await proxy.hasRole(ADMIN_ROLE, admin1.address)).to.be.true;
      expect(await proxy.hasRole(MODERATOR_ROLE, admin1.address)).to.be.false;

      // Should still be able to use admin functions
      await expect(proxy.connect(admin1).pause()).to.not.be.reverted;
    });
  });

  describe("Role Hierarchy and Permissions", function () {
    it("Should require DEFAULT_ADMIN_ROLE to manage roles", async function () {
      const { proxy, owner, admin1, user1 } = await loadFixture(deployTodoListV2Fixture);

      const ADMIN_ROLE = await proxy.ADMIN_ROLE();
      const MODERATOR_ROLE = await proxy.MODERATOR_ROLE();

      // Grant only ADMIN_ROLE (not DEFAULT_ADMIN_ROLE)
      await proxy.connect(owner).grantRoleWithEvent(ADMIN_ROLE, admin1.address);

      // Admin without DEFAULT_ADMIN_ROLE should not be able to grant roles
      await expect(
        proxy.connect(admin1).grantRoleWithEvent(MODERATOR_ROLE, user1.address)
      ).to.be.reverted;
    });

    it("Should verify DEFAULT_ADMIN_ROLE holder can manage all roles", async function () {
      const { proxy, owner, user1 } = await loadFixture(deployTodoListV2Fixture);

      const DEFAULT_ADMIN_ROLE = await proxy.DEFAULT_ADMIN_ROLE();
      const ADMIN_ROLE = await proxy.ADMIN_ROLE();
      const MODERATOR_ROLE = await proxy.MODERATOR_ROLE();
      const UPGRADER_ROLE = await proxy.UPGRADER_ROLE();

      expect(await proxy.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.be.true;

      // Should be able to grant all roles
      await expect(proxy.connect(owner).grantRoleWithEvent(ADMIN_ROLE, user1.address)).to.not.be.reverted;
      await expect(proxy.connect(owner).grantRoleWithEvent(MODERATOR_ROLE, user1.address)).to.not.be.reverted;
      await expect(proxy.connect(owner).grantRoleWithEvent(UPGRADER_ROLE, user1.address)).to.not.be.reverted;
    });

    it("Should prevent users without DEFAULT_ADMIN_ROLE from using grantRoleWithEvent", async function () {
      const { proxy, user1, user2 } = await loadFixture(deployTodoListV2Fixture);

      const MODERATOR_ROLE = await proxy.MODERATOR_ROLE();

      await expect(
        proxy.connect(user1).grantRoleWithEvent(MODERATOR_ROLE, user2.address)
      ).to.be.reverted;
    });
  });

  describe("Role Renunciation", function () {
    it("Should allow user to renounce their own role", async function () {
      const { proxy, owner, admin1 } = await loadFixture(deployTodoListV2Fixture);

      const ADMIN_ROLE = await proxy.ADMIN_ROLE();

      await proxy.connect(owner).grantRoleWithEvent(ADMIN_ROLE, admin1.address);
      expect(await proxy.hasRole(ADMIN_ROLE, admin1.address)).to.be.true;

      // Renounce role
      await proxy.connect(admin1).renounceRole(ADMIN_ROLE, admin1.address);
      expect(await proxy.hasRole(ADMIN_ROLE, admin1.address)).to.be.false;
    });

    it("Should prevent user from renouncing other user's roles", async function () {
      const { proxy, owner, admin1 } = await loadFixture(deployTodoListV2Fixture);

      const ADMIN_ROLE = await proxy.ADMIN_ROLE();

      await proxy.connect(owner).grantRoleWithEvent(ADMIN_ROLE, admin1.address);

      // Admin1 tries to renounce owner's role
      await expect(
        proxy.connect(admin1).renounceRole(ADMIN_ROLE, owner.address)
      ).to.be.reverted;
    });
  });

  describe("Complex Multi-Role Scenarios", function () {
    it("Should handle team with multiple admins, moderators, and upgraders", async function () {
      const { proxy, owner, admin1, admin2, moderator1, moderator2, upgrader1, upgrader2 } =
        await loadFixture(deployTodoListV2Fixture);

      const ADMIN_ROLE = await proxy.ADMIN_ROLE();
      const MODERATOR_ROLE = await proxy.MODERATOR_ROLE();
      const UPGRADER_ROLE = await proxy.UPGRADER_ROLE();

      // Create a full team
      await proxy.connect(owner).grantRoleWithEvent(ADMIN_ROLE, admin1.address);
      await proxy.connect(owner).grantRoleWithEvent(ADMIN_ROLE, admin2.address);
      await proxy.connect(owner).grantRoleWithEvent(MODERATOR_ROLE, moderator1.address);
      await proxy.connect(owner).grantRoleWithEvent(MODERATOR_ROLE, moderator2.address);
      await proxy.connect(owner).grantRoleWithEvent(UPGRADER_ROLE, upgrader1.address);
      await proxy.connect(owner).grantRoleWithEvent(UPGRADER_ROLE, upgrader2.address);

      // Verify all roles are correctly assigned
      expect(await proxy.hasRole(ADMIN_ROLE, admin1.address)).to.be.true;
      expect(await proxy.hasRole(ADMIN_ROLE, admin2.address)).to.be.true;
      expect(await proxy.hasRole(MODERATOR_ROLE, moderator1.address)).to.be.true;
      expect(await proxy.hasRole(MODERATOR_ROLE, moderator2.address)).to.be.true;
      expect(await proxy.hasRole(UPGRADER_ROLE, upgrader1.address)).to.be.true;
      expect(await proxy.hasRole(UPGRADER_ROLE, upgrader2.address)).to.be.true;
    });

    it("Should handle role changes during active operations", async function () {
      const { proxy, owner, admin1, user1 } = await loadFixture(deployTodoListV2Fixture);

      const ADMIN_ROLE = await proxy.ADMIN_ROLE();

      // User creates tasks
      await proxy.connect(user1).createTask("Task 1");

      // Grant admin role to admin1
      await proxy.connect(owner).grantRoleWithEvent(ADMIN_ROLE, admin1.address);

      // Admin1 can now pause
      await proxy.connect(admin1).pause();

      // Revoke admin role
      await proxy.connect(owner).revokeRoleWithEvent(ADMIN_ROLE, admin1.address);

      // Unpause first
      await proxy.connect(owner).unpause();

      // Admin1 can no longer pause
      await expect(
        proxy.connect(admin1).pause()
      ).to.be.reverted;

      // User can still create tasks
      await expect(
        proxy.connect(user1).createTask("Task 2")
      ).to.not.be.reverted;
    });

    it("Should properly handle emergency scenarios with multiple admins", async function () {
      const { proxy, owner, admin1, admin2, user1 } = await loadFixture(deployTodoListV2Fixture);

      const ADMIN_ROLE = await proxy.ADMIN_ROLE();

      await proxy.connect(owner).grantRoleWithEvent(ADMIN_ROLE, admin1.address);
      await proxy.connect(owner).grantRoleWithEvent(ADMIN_ROLE, admin2.address);

      // Admin1 activates circuit breaker in emergency
      await proxy.connect(admin1).activateCircuitBreaker();

      // Operations should be blocked
      await expect(
        proxy.connect(user1).createTask("Emergency task")
      ).to.be.revertedWith("Circuit breaker active: contract operations suspended");

      // Admin2 deactivates after emergency is resolved
      await proxy.connect(admin2).deactivateCircuitBreaker();

      // Operations should work again
      await expect(
        proxy.connect(user1).createTask("Post-emergency task")
      ).to.not.be.reverted;
    });
  });

  describe("Role-Based Access Control Edge Cases", function () {
    it("Should handle rapid role grant/revoke cycles", async function () {
      const { proxy, owner, user1 } = await loadFixture(deployTodoListV2Fixture);

      const ADMIN_ROLE = await proxy.ADMIN_ROLE();

      for (let i = 0; i < 5; i++) {
        await proxy.connect(owner).grantRoleWithEvent(ADMIN_ROLE, user1.address);
        expect(await proxy.hasRole(ADMIN_ROLE, user1.address)).to.be.true;

        await proxy.connect(owner).revokeRoleWithEvent(ADMIN_ROLE, user1.address);
        expect(await proxy.hasRole(ADMIN_ROLE, user1.address)).to.be.false;
      }
    });

    it("Should verify role state is consistent after multiple operations", async function () {
      const { proxy, owner, admin1, moderator1, upgrader1 } = await loadFixture(deployTodoListV2Fixture);

      const ADMIN_ROLE = await proxy.ADMIN_ROLE();
      const MODERATOR_ROLE = await proxy.MODERATOR_ROLE();
      const UPGRADER_ROLE = await proxy.UPGRADER_ROLE();

      // Complex sequence of role operations
      await proxy.connect(owner).grantRoleWithEvent(ADMIN_ROLE, admin1.address);
      await proxy.connect(owner).grantRoleWithEvent(MODERATOR_ROLE, moderator1.address);
      await proxy.connect(owner).grantRoleWithEvent(UPGRADER_ROLE, upgrader1.address);
      await proxy.connect(owner).revokeRoleWithEvent(MODERATOR_ROLE, moderator1.address);
      await proxy.connect(owner).grantRoleWithEvent(MODERATOR_ROLE, admin1.address);

      // Verify final state
      expect(await proxy.hasRole(ADMIN_ROLE, admin1.address)).to.be.true;
      expect(await proxy.hasRole(MODERATOR_ROLE, admin1.address)).to.be.true;
      expect(await proxy.hasRole(MODERATOR_ROLE, moderator1.address)).to.be.false;
      expect(await proxy.hasRole(UPGRADER_ROLE, upgrader1.address)).to.be.true;
    });

    it("Should prevent role escalation attacks", async function () {
      const { proxy, owner, user1, user2 } = await loadFixture(deployTodoListV2Fixture);

      const ADMIN_ROLE = await proxy.ADMIN_ROLE();
      const MODERATOR_ROLE = await proxy.MODERATOR_ROLE();

      // Grant moderator role to user1
      await proxy.connect(owner).grantRoleWithEvent(MODERATOR_ROLE, user1.address);

      // User1 should not be able to grant themselves admin role
      await expect(
        proxy.connect(user1).grantRoleWithEvent(ADMIN_ROLE, user1.address)
      ).to.be.reverted;

      // User1 should not be able to grant admin role to others
      await expect(
        proxy.connect(user1).grantRoleWithEvent(ADMIN_ROLE, user2.address)
      ).to.be.reverted;
    });
  });
});
