const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("TodoList", function () {
  // Fixture to deploy the contract
  async function deployTodoListFixture() {
    const [owner, addr1, addr2] = await ethers.getSigners();

    const TodoList = await ethers.getContractFactory("TodoList");
    const todoList = await TodoList.deploy();

    return { todoList, owner, addr1, addr2 };
  }

  describe("Deployment", function () {
    it("Should deploy successfully", async function () {
      const { todoList } = await loadFixture(deployTodoListFixture);
      expect(await todoList.getAddress()).to.be.properAddress;
    });

    it("Should start with zero total tasks", async function () {
      const { todoList } = await loadFixture(deployTodoListFixture);
      expect(await todoList.getTotalTaskCount()).to.equal(0);
    });
  });

  describe("Task Creation", function () {
    it("Should create a task successfully", async function () {
      const { todoList, owner } = await loadFixture(deployTodoListFixture);
      const description = "Buy groceries";

      const tx = await todoList.createTask(description);
      await tx.wait();

      const taskCount = await todoList.getTaskCount(owner.address);
      expect(taskCount).to.equal(1);
    });

    it("Should emit TaskCreated event", async function () {
      const { todoList, owner } = await loadFixture(deployTodoListFixture);
      const description = "Buy groceries";

      await expect(todoList.createTask(description))
        .to.emit(todoList, "TaskCreated")
        .withArgs(1, owner.address, description);
    });

    it("Should return correct taskId", async function () {
      const { todoList } = await loadFixture(deployTodoListFixture);

      const tx = await todoList.createTask("Task 1");
      const receipt = await tx.wait();

      // Get the TaskCreated event from receipt
      const event = receipt.logs.find(
        log => log.fragment && log.fragment.name === "TaskCreated"
      );
      expect(event.args[0]).to.equal(1); // taskId should be 1
    });

    it("Should increment taskId for multiple tasks", async function () {
      const { todoList } = await loadFixture(deployTodoListFixture);

      await todoList.createTask("Task 1");
      await todoList.createTask("Task 2");
      await todoList.createTask("Task 3");

      expect(await todoList.getTotalTaskCount()).to.equal(3);
    });

    it("Should store task with correct properties", async function () {
      const { todoList, owner } = await loadFixture(deployTodoListFixture);
      const description = "Complete project";

      await todoList.createTask(description);
      const task = await todoList.getTask(1);

      expect(task.id).to.equal(1);
      expect(task.owner).to.equal(owner.address);
      expect(task.description).to.equal(description);
      expect(task.completed).to.equal(false);
      expect(task.createdAt).to.be.gt(0);
      expect(task.completedAt).to.equal(0);
    });

    it("Should reject empty description", async function () {
      const { todoList } = await loadFixture(deployTodoListFixture);

      await expect(todoList.createTask("")).to.be.revertedWith(
        "Description cannot be empty"
      );
    });

    it("Should reject description over 500 characters", async function () {
      const { todoList } = await loadFixture(deployTodoListFixture);
      const longDescription = "a".repeat(501);

      await expect(todoList.createTask(longDescription)).to.be.revertedWith(
        "Description too long"
      );
    });

    it("Should allow multiple users to create tasks", async function () {
      const { todoList, owner, addr1 } = await loadFixture(deployTodoListFixture);

      await todoList.connect(owner).createTask("Owner task");
      await todoList.connect(addr1).createTask("User1 task");

      expect(await todoList.getTaskCount(owner.address)).to.equal(1);
      expect(await todoList.getTaskCount(addr1.address)).to.equal(1);
    });
  });

  describe("Task Completion", function () {
    it("Should complete a task successfully", async function () {
      const { todoList, owner } = await loadFixture(deployTodoListFixture);

      await todoList.createTask("Task to complete");
      await todoList.completeTask(1);

      const task = await todoList.getTask(1);
      expect(task.completed).to.equal(true);
      expect(task.completedAt).to.be.gt(0);
    });

    it("Should emit TaskCompleted event", async function () {
      const { todoList, owner } = await loadFixture(deployTodoListFixture);

      await todoList.createTask("Task to complete");

      await expect(todoList.completeTask(1))
        .to.emit(todoList, "TaskCompleted")
        .withArgs(1, owner.address);
    });

    it("Should not allow completing already completed task", async function () {
      const { todoList } = await loadFixture(deployTodoListFixture);

      await todoList.createTask("Task to complete");
      await todoList.completeTask(1);

      await expect(todoList.completeTask(1)).to.be.revertedWith(
        "Task already completed"
      );
    });

    it("Should not allow non-owner to complete task", async function () {
      const { todoList, owner, addr1 } = await loadFixture(deployTodoListFixture);

      await todoList.connect(owner).createTask("Owner's task");

      await expect(todoList.connect(addr1).completeTask(1)).to.be.revertedWith(
        "Not task owner"
      );
    });

    it("Should revert when completing non-existent task", async function () {
      const { todoList } = await loadFixture(deployTodoListFixture);

      await expect(todoList.completeTask(999)).to.be.revertedWith(
        "Task does not exist"
      );
    });

    it("Should return true for isTaskCompleted after completion", async function () {
      const { todoList } = await loadFixture(deployTodoListFixture);

      await todoList.createTask("Task");
      expect(await todoList.isTaskCompleted(1)).to.equal(false);

      await todoList.completeTask(1);
      expect(await todoList.isTaskCompleted(1)).to.equal(true);
    });
  });

  describe("Task Deletion", function () {
    it("Should delete a task successfully", async function () {
      const { todoList, owner } = await loadFixture(deployTodoListFixture);

      await todoList.createTask("Task to delete");
      await todoList.deleteTask(1);

      expect(await todoList.getTaskCount(owner.address)).to.equal(0);
    });

    it("Should emit TaskDeleted event", async function () {
      const { todoList, owner } = await loadFixture(deployTodoListFixture);

      await todoList.createTask("Task to delete");

      await expect(todoList.deleteTask(1))
        .to.emit(todoList, "TaskDeleted")
        .withArgs(1, owner.address);
    });

    it("Should not allow non-owner to delete task", async function () {
      const { todoList, owner, addr1 } = await loadFixture(deployTodoListFixture);

      await todoList.connect(owner).createTask("Owner's task");

      await expect(todoList.connect(addr1).deleteTask(1)).to.be.revertedWith(
        "Not task owner"
      );
    });

    it("Should revert when deleting non-existent task", async function () {
      const { todoList } = await loadFixture(deployTodoListFixture);

      await expect(todoList.deleteTask(999)).to.be.revertedWith(
        "Task does not exist"
      );
    });

    it("Should remove task from user's task list", async function () {
      const { todoList, owner } = await loadFixture(deployTodoListFixture);

      await todoList.createTask("Task 1");
      await todoList.createTask("Task 2");
      await todoList.createTask("Task 3");

      let userTasks = await todoList.getUserTasks(owner.address);
      expect(userTasks.length).to.equal(3);

      await todoList.deleteTask(2);

      userTasks = await todoList.getUserTasks(owner.address);
      expect(userTasks.length).to.equal(2);
      expect(userTasks).to.not.include(2);
    });

    it("Should allow deleting completed task", async function () {
      const { todoList } = await loadFixture(deployTodoListFixture);

      await todoList.createTask("Task");
      await todoList.completeTask(1);
      await todoList.deleteTask(1);

      await expect(todoList.getTask(1)).to.be.revertedWith(
        "Task does not exist"
      );
    });
  });

  describe("Task Retrieval", function () {
    it("Should get task details correctly", async function () {
      const { todoList, owner } = await loadFixture(deployTodoListFixture);
      const description = "Test task";

      await todoList.createTask(description);
      const task = await todoList.getTask(1);

      expect(task.id).to.equal(1);
      expect(task.owner).to.equal(owner.address);
      expect(task.description).to.equal(description);
      expect(task.completed).to.equal(false);
    });

    it("Should get user tasks correctly", async function () {
      const { todoList, owner } = await loadFixture(deployTodoListFixture);

      await todoList.createTask("Task 1");
      await todoList.createTask("Task 2");
      await todoList.createTask("Task 3");

      const userTasks = await todoList.getUserTasks(owner.address);
      expect(userTasks.length).to.equal(3);
      expect(userTasks[0]).to.equal(1);
      expect(userTasks[1]).to.equal(2);
      expect(userTasks[2]).to.equal(3);
    });

    it("Should get task count correctly", async function () {
      const { todoList, owner } = await loadFixture(deployTodoListFixture);

      expect(await todoList.getTaskCount(owner.address)).to.equal(0);

      await todoList.createTask("Task 1");
      expect(await todoList.getTaskCount(owner.address)).to.equal(1);

      await todoList.createTask("Task 2");
      expect(await todoList.getTaskCount(owner.address)).to.equal(2);

      await todoList.deleteTask(1);
      expect(await todoList.getTaskCount(owner.address)).to.equal(1);
    });

    it("Should get user task details correctly", async function () {
      const { todoList, owner } = await loadFixture(deployTodoListFixture);

      await todoList.createTask("Task 1");
      await todoList.createTask("Task 2");

      const taskDetails = await todoList.getUserTaskDetails(owner.address);
      expect(taskDetails.length).to.equal(2);
      expect(taskDetails[0].description).to.equal("Task 1");
      expect(taskDetails[1].description).to.equal("Task 2");
    });

    it("Should return empty array for user with no tasks", async function () {
      const { todoList, addr1 } = await loadFixture(deployTodoListFixture);

      const userTasks = await todoList.getUserTasks(addr1.address);
      expect(userTasks.length).to.equal(0);
    });
  });

  describe("Multi-user Scenarios", function () {
    it("Should maintain separate task lists for different users", async function () {
      const { todoList, owner, addr1 } = await loadFixture(deployTodoListFixture);

      await todoList.connect(owner).createTask("Owner task 1");
      await todoList.connect(owner).createTask("Owner task 2");
      await todoList.connect(addr1).createTask("User1 task 1");

      expect(await todoList.getTaskCount(owner.address)).to.equal(2);
      expect(await todoList.getTaskCount(addr1.address)).to.equal(1);
    });

    it("Should not allow users to access other users' tasks", async function () {
      const { todoList, owner, addr1 } = await loadFixture(deployTodoListFixture);

      await todoList.connect(owner).createTask("Owner task");

      // addr1 tries to complete owner's task
      await expect(
        todoList.connect(addr1).completeTask(1)
      ).to.be.revertedWith("Not task owner");

      // addr1 tries to delete owner's task
      await expect(
        todoList.connect(addr1).deleteTask(1)
      ).to.be.revertedWith("Not task owner");
    });
  });

  describe("Edge Cases", function () {
    it("Should handle creating many tasks", async function () {
      const { todoList, owner } = await loadFixture(deployTodoListFixture);

      for (let i = 1; i <= 10; i++) {
        await todoList.createTask(`Task ${i}`);
      }

      expect(await todoList.getTaskCount(owner.address)).to.equal(10);
      expect(await todoList.getTotalTaskCount()).to.equal(10);
    });

    it("Should handle deleting all tasks", async function () {
      const { todoList, owner } = await loadFixture(deployTodoListFixture);

      await todoList.createTask("Task 1");
      await todoList.createTask("Task 2");
      await todoList.createTask("Task 3");

      await todoList.deleteTask(1);
      await todoList.deleteTask(2);
      await todoList.deleteTask(3);

      expect(await todoList.getTaskCount(owner.address)).to.equal(0);
      const userTasks = await todoList.getUserTasks(owner.address);
      expect(userTasks.length).to.equal(0);
    });

    it("Should handle maximum description length", async function () {
      const { todoList } = await loadFixture(deployTodoListFixture);
      const maxDescription = "a".repeat(500);

      await expect(todoList.createTask(maxDescription)).to.not.be.reverted;
    });
  });
});
