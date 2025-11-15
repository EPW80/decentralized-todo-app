// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title TodoList
 * @dev Decentralized Todo List smart contract
 * @notice This contract allows users to create, complete, and delete tasks
 */
contract TodoList {
    // Task structure
    struct Task {
        uint256 id;
        address owner;
        string description;
        bool completed;
        uint256 createdAt;
        uint256 completedAt;
    }

    // State variables
    uint256 private taskCounter;
    mapping(uint256 => Task) private tasks;
    mapping(address => uint256[]) private userTasks;
    mapping(address => uint256) private userTaskCount;

    // Events
    event TaskCreated(uint256 indexed taskId, address indexed owner, string description);
    event TaskCompleted(uint256 indexed taskId, address indexed owner);
    event TaskDeleted(uint256 indexed taskId, address indexed owner);

    // Modifiers
    modifier taskExists(uint256 _taskId) {
        require(tasks[_taskId].id != 0, "Task does not exist");
        _;
    }

    modifier onlyTaskOwner(uint256 _taskId) {
        require(tasks[_taskId].owner == msg.sender, "Not task owner");
        _;
    }

    /**
     * @dev Create a new task
     * @param _description The description of the task
     * @return taskId The ID of the created task
     */
    function createTask(string memory _description) external returns (uint256) {
        require(bytes(_description).length > 0, "Description cannot be empty");
        require(bytes(_description).length <= 500, "Description too long");

        taskCounter++;
        uint256 taskId = taskCounter;

        Task memory newTask = Task({
            id: taskId,
            owner: msg.sender,
            description: _description,
            completed: false,
            createdAt: block.timestamp,
            completedAt: 0
        });

        tasks[taskId] = newTask;
        userTasks[msg.sender].push(taskId);
        userTaskCount[msg.sender]++;

        emit TaskCreated(taskId, msg.sender, _description);

        return taskId;
    }

    /**
     * @dev Mark a task as completed
     * @param _taskId The ID of the task to complete
     */
    function completeTask(uint256 _taskId)
        external
        taskExists(_taskId)
        onlyTaskOwner(_taskId)
    {
        require(!tasks[_taskId].completed, "Task already completed");

        tasks[_taskId].completed = true;
        tasks[_taskId].completedAt = block.timestamp;

        emit TaskCompleted(_taskId, msg.sender);
    }

    /**
     * @dev Delete a task
     * @param _taskId The ID of the task to delete
     */
    function deleteTask(uint256 _taskId)
        external
        taskExists(_taskId)
        onlyTaskOwner(_taskId)
    {
        // Remove from user's task array
        uint256[] storage userTaskArray = userTasks[msg.sender];
        for (uint256 i = 0; i < userTaskArray.length; i++) {
            if (userTaskArray[i] == _taskId) {
                userTaskArray[i] = userTaskArray[userTaskArray.length - 1];
                userTaskArray.pop();
                break;
            }
        }

        userTaskCount[msg.sender]--;
        emit TaskDeleted(_taskId, msg.sender);

        delete tasks[_taskId];
    }

    /**
     * @dev Get task details
     * @param _taskId The ID of the task
     * @return Task struct containing task details
     */
    function getTask(uint256 _taskId)
        external
        view
        taskExists(_taskId)
        returns (Task memory)
    {
        return tasks[_taskId];
    }

    /**
     * @dev Get all task IDs for a user
     * @param _user The address of the user
     * @return Array of task IDs
     */
    function getUserTasks(address _user)
        external
        view
        returns (uint256[] memory)
    {
        return userTasks[_user];
    }

    /**
     * @dev Get the count of tasks for a user
     * @param _user The address of the user
     * @return The number of tasks
     */
    function getTaskCount(address _user)
        external
        view
        returns (uint256)
    {
        return userTaskCount[_user];
    }

    /**
     * @dev Get all task details for a user
     * @param _user The address of the user
     * @return Array of Task structs
     */
    function getUserTaskDetails(address _user)
        external
        view
        returns (Task[] memory)
    {
        uint256[] memory taskIds = userTasks[_user];
        Task[] memory userTasksArray = new Task[](taskIds.length);

        for (uint256 i = 0; i < taskIds.length; i++) {
            userTasksArray[i] = tasks[taskIds[i]];
        }

        return userTasksArray;
    }

    /**
     * @dev Get the total number of tasks created
     * @return The total task count
     */
    function getTotalTaskCount() external view returns (uint256) {
        return taskCounter;
    }

    /**
     * @dev Check if a task is completed
     * @param _taskId The ID of the task
     * @return Boolean indicating completion status
     */
    function isTaskCompleted(uint256 _taskId)
        external
        view
        taskExists(_taskId)
        returns (bool)
    {
        return tasks[_taskId].completed;
    }
}
