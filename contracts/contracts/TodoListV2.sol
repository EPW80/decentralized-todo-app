// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

/**
 * @title TodoListV2
 * @dev Enhanced Decentralized Todo List with advanced security features
 * @notice This contract implements:
 *   - UUPS Upgradeability Pattern
 *   - Role-Based Access Control (RBAC)
 *   - Circuit Breaker Pattern
 *   - Pull Payment Pattern for future features
 *   - Meta-transaction support with nonce tracking
 *   - Emergency withdrawal mechanism
 * 
 * Security Features:
 *   - Reentrancy protection
 *   - Pausable for emergency stops
 *   - Rate limiting per user
 *   - Granular access controls (ADMIN, MODERATOR, UPGRADER roles)
 *   - Emergency circuit breaker
 */
contract TodoListV2 is 
    Initializable,
    ReentrancyGuardUpgradeable,
    PausableUpgradeable,
    AccessControlUpgradeable,
    UUPSUpgradeable 
{
    // ============ Role Definitions ============
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant MODERATOR_ROLE = keccak256("MODERATOR_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

    // ============ Task Structure ============
    struct Task {
        uint256 id;
        address owner;
        string description;
        bool completed;
        bool deleted;
        uint256 createdAt;
        uint256 completedAt;
        uint256 deletedAt;
        uint256 dueDate;
    }

    // ============ State Variables ============
    uint256 private taskCounter;
    mapping(uint256 => Task) private tasks;
    mapping(address => uint256[]) private userTasks;
    mapping(address => uint256) private userTaskCount;

    // Rate limiting
    mapping(address => uint256) private lastActionTimestamp;
    uint256 public actionCooldown;

    // DoS protection
    uint256 public maxTasksPerUser;

    // Circuit breaker
    bool public circuitBreakerActive;
    uint256 public circuitBreakerTimestamp;

    // Pull payment balances (for future payment features)
    mapping(address => uint256) private pendingWithdrawals;
    uint256 public totalPendingWithdrawals;

    // Meta-transaction nonce tracking
    mapping(address => uint256) public nonces;

    // ============ Events ============
    event TaskCreated(uint256 indexed taskId, address indexed owner, string description, uint256 timestamp, uint256 dueDate);
    event TaskUpdated(uint256 indexed taskId, address indexed owner, string oldDescription, string newDescription, uint256 timestamp);
    event TaskCompleted(uint256 indexed taskId, address indexed owner, uint256 timestamp);
    event TaskDeleted(uint256 indexed taskId, address indexed owner, uint256 timestamp);
    event TaskRestored(uint256 indexed taskId, address indexed owner, uint256 timestamp);
    
    event ContractPaused(address indexed by, uint256 timestamp);
    event ContractUnpaused(address indexed by, uint256 timestamp);
    event CircuitBreakerActivated(address indexed by, uint256 timestamp);
    event CircuitBreakerDeactivated(address indexed by, uint256 timestamp);
    
    event CooldownUpdated(uint256 oldCooldown, uint256 newCooldown);
    event MaxTasksUpdated(uint256 oldMax, uint256 newMax);
    
    event WithdrawalQueued(address indexed user, uint256 amount, uint256 timestamp);
    event WithdrawalExecuted(address indexed user, uint256 amount, uint256 timestamp);
    
    event RoleGrantedByAdmin(bytes32 indexed role, address indexed account, address indexed sender);
    event RoleRevokedByAdmin(bytes32 indexed role, address indexed account, address indexed sender);

    // ============ Modifiers ============
    modifier taskExists(uint256 _taskId) {
        require(tasks[_taskId].id != 0, "Task does not exist");
        _;
    }

    modifier onlyTaskOwner(uint256 _taskId) {
        require(tasks[_taskId].owner == msg.sender, "Not task owner");
        _;
    }

    modifier rateLimited() {
        require(
            block.timestamp >= lastActionTimestamp[msg.sender] + actionCooldown,
            "Rate limit: please wait before next action"
        );
        lastActionTimestamp[msg.sender] = block.timestamp;
        _;
    }

    modifier circuitBreakerCheck() {
        require(!circuitBreakerActive, "Circuit breaker active: contract operations suspended");
        _;
    }

    modifier notDeleted(uint256 _taskId) {
        require(!tasks[_taskId].deleted, "Task has been deleted");
        _;
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    // ============ Initialization ============
    /**
     * @dev Initializer function (replaces constructor for upgradeable contracts)
     * @param _initialAdmin Address of the initial admin
     */
    function initialize(address _initialAdmin) public initializer {
        __ReentrancyGuard_init();
        __Pausable_init();
        __AccessControl_init();
        __UUPSUpgradeable_init();

        // Set up roles
        _grantRole(DEFAULT_ADMIN_ROLE, _initialAdmin);
        _grantRole(ADMIN_ROLE, _initialAdmin);
        _grantRole(MODERATOR_ROLE, _initialAdmin);
        _grantRole(UPGRADER_ROLE, _initialAdmin);

        // Initialize default values
        actionCooldown = 1 seconds;
        maxTasksPerUser = 10000;
        circuitBreakerActive = false;
    }

    // ============ Core Task Functions ============
    /**
     * @dev Create a new task
     * @param _description The description of the task
     * @param _dueDate Optional due date timestamp (0 for no due date)
     * @return taskId The ID of the created task
     */
    function createTask(string memory _description, uint256 _dueDate)
        external
        nonReentrant
        whenNotPaused
        circuitBreakerCheck
        rateLimited
        returns (uint256)
    {
        require(bytes(_description).length > 0, "Description cannot be empty");
        require(bytes(_description).length <= 500, "Description too long");
        require(userTaskCount[msg.sender] < maxTasksPerUser, "Maximum tasks limit reached");
        if (_dueDate > 0) {
            require(_dueDate > block.timestamp, "Due date must be in the future");
        }

        taskCounter++;
        uint256 taskId = taskCounter;

        Task memory newTask = Task({
            id: taskId,
            owner: msg.sender,
            description: _description,
            completed: false,
            deleted: false,
            createdAt: block.timestamp,
            completedAt: 0,
            deletedAt: 0,
            dueDate: _dueDate
        });

        tasks[taskId] = newTask;
        userTasks[msg.sender].push(taskId);
        userTaskCount[msg.sender]++;

        emit TaskCreated(taskId, msg.sender, _description, block.timestamp, _dueDate);

        return taskId;
    }

    /**
     * @dev Mark a task as completed
     * @param _taskId The ID of the task to complete
     */
    function completeTask(uint256 _taskId)
        external
        nonReentrant
        whenNotPaused
        circuitBreakerCheck
        rateLimited
        taskExists(_taskId)
        onlyTaskOwner(_taskId)
        notDeleted(_taskId)
    {
        require(!tasks[_taskId].completed, "Task already completed");

        tasks[_taskId].completed = true;
        tasks[_taskId].completedAt = block.timestamp;

        emit TaskCompleted(_taskId, msg.sender, block.timestamp);
    }

    /**
     * @dev Soft delete a task (marks as deleted but keeps data)
     * @param _taskId The ID of the task to delete
     */
    function deleteTask(uint256 _taskId)
        external
        nonReentrant
        whenNotPaused
        circuitBreakerCheck
        rateLimited
        taskExists(_taskId)
        onlyTaskOwner(_taskId)
        notDeleted(_taskId)
    {
        tasks[_taskId].deleted = true;
        tasks[_taskId].deletedAt = block.timestamp;
        userTaskCount[msg.sender]--;

        emit TaskDeleted(_taskId, msg.sender, block.timestamp);
    }

    /**
     * @dev Restore a soft-deleted task
     * @param _taskId The ID of the task to restore
     */
    function restoreTask(uint256 _taskId)
        external
        nonReentrant
        whenNotPaused
        circuitBreakerCheck
        taskExists(_taskId)
        onlyTaskOwner(_taskId)
    {
        require(tasks[_taskId].deleted, "Task is not deleted");

        tasks[_taskId].deleted = false;
        tasks[_taskId].deletedAt = 0;
        userTaskCount[msg.sender]++;

        emit TaskRestored(_taskId, msg.sender, block.timestamp);
    }

    /**
     * @dev Update task description
     * @param _taskId The ID of the task to update
     * @param _newDescription New description for the task
     */
    function updateTask(uint256 _taskId, string memory _newDescription)
        external
        nonReentrant
        whenNotPaused
        circuitBreakerCheck
        rateLimited
        taskExists(_taskId)
        onlyTaskOwner(_taskId)
        notDeleted(_taskId)
    {
        require(bytes(_newDescription).length > 0, "Description cannot be empty");
        require(bytes(_newDescription).length <= 500, "Description too long");

        string memory oldDescription = tasks[_taskId].description;
        tasks[_taskId].description = _newDescription;

        emit TaskUpdated(_taskId, msg.sender, oldDescription, _newDescription, block.timestamp);
    }

    // ============ Access Control Functions ============
    /**
     * @dev Pause the contract - only ADMIN can call
     */
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
        emit ContractPaused(msg.sender, block.timestamp);
    }

    /**
     * @dev Unpause the contract - only ADMIN can call
     */
    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
        emit ContractUnpaused(msg.sender, block.timestamp);
    }

    /**
     * @dev Activate circuit breaker - emergency stop for critical issues
     * @notice More severe than pause, requires explicit deactivation
     */
    function activateCircuitBreaker() external onlyRole(ADMIN_ROLE) {
        require(!circuitBreakerActive, "Circuit breaker already active");
        circuitBreakerActive = true;
        circuitBreakerTimestamp = block.timestamp;
        emit CircuitBreakerActivated(msg.sender, block.timestamp);
    }

    /**
     * @dev Deactivate circuit breaker - resume operations after emergency
     */
    function deactivateCircuitBreaker() external onlyRole(ADMIN_ROLE) {
        require(circuitBreakerActive, "Circuit breaker not active");
        circuitBreakerActive = false;
        emit CircuitBreakerDeactivated(msg.sender, block.timestamp);
    }

    /**
     * @dev Grant a role to an account (with custom event)
     * @param role The role to grant
     * @param account The account to receive the role
     */
    function grantRoleWithEvent(bytes32 role, address account) external onlyRole(ADMIN_ROLE) {
        grantRole(role, account);
        emit RoleGrantedByAdmin(role, account, msg.sender);
    }

    /**
     * @dev Revoke a role from an account (with custom event)
     * @param role The role to revoke
     * @param account The account to lose the role
     */
    function revokeRoleWithEvent(bytes32 role, address account) external onlyRole(ADMIN_ROLE) {
        revokeRole(role, account);
        emit RoleRevokedByAdmin(role, account, msg.sender);
    }

    // ============ Configuration Functions ============
    /**
     * @dev Update action cooldown period
     * @param _newCooldown New cooldown period in seconds
     */
    function updateCooldown(uint256 _newCooldown) external onlyRole(ADMIN_ROLE) {
        require(_newCooldown <= 1 hours, "Cooldown too long");
        uint256 oldCooldown = actionCooldown;
        actionCooldown = _newCooldown;
        emit CooldownUpdated(oldCooldown, _newCooldown);
    }

    /**
     * @dev Update maximum tasks per user
     * @param _newMax New maximum task limit
     */
    function updateMaxTasks(uint256 _newMax) external onlyRole(ADMIN_ROLE) {
        require(_newMax >= 100, "Max tasks too low");
        require(_newMax <= 1000000, "Max tasks too high");
        uint256 oldMax = maxTasksPerUser;
        maxTasksPerUser = _newMax;
        emit MaxTasksUpdated(oldMax, _newMax);
    }

    // ============ Pull Payment Pattern ============
    /**
     * @dev Queue a withdrawal for an address (pull payment pattern)
     * @param _recipient Address to receive payment
     * @param _amount Amount to queue for withdrawal
     * @notice Internal function for future payment features
     */
    function _queueWithdrawal(address _recipient, uint256 _amount) internal {
        require(_recipient != address(0), "Invalid recipient");
        pendingWithdrawals[_recipient] += _amount;
        totalPendingWithdrawals += _amount;
        emit WithdrawalQueued(_recipient, _amount, block.timestamp);
    }

    /**
     * @dev Withdraw pending balance (pull payment pattern)
     * @notice Users pull their own funds, preventing reentrancy attacks
     */
    function withdraw() external nonReentrant {
        uint256 amount = pendingWithdrawals[msg.sender];
        require(amount > 0, "No pending withdrawal");
        
        pendingWithdrawals[msg.sender] = 0;
        totalPendingWithdrawals -= amount;
        
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Withdrawal failed");
        
        emit WithdrawalExecuted(msg.sender, amount, block.timestamp);
    }

    /**
     * @dev Get pending withdrawal balance
     * @param _user Address to check
     * @return Pending withdrawal amount
     */
    function getPendingWithdrawal(address _user) external view returns (uint256) {
        return pendingWithdrawals[_user];
    }

    // ============ Meta-Transaction Support ============
    /**
     * @dev Get the current nonce for an address
     * @param _user Address to check
     * @return Current nonce value
     */
    function getNonce(address _user) external view returns (uint256) {
        return nonces[_user];
    }

    /**
     * @dev Increment nonce for meta-transaction tracking
     * @notice Would be used with EIP-712 signatures for gasless transactions
     */
    function _incrementNonce(address _user) internal {
        nonces[_user]++;
    }

    // ============ View Functions ============
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
     * @dev Get the count of active tasks for a user
     * @param _user The address of the user
     * @return The number of active tasks
     */
    function getTaskCount(address _user)
        external
        view
        returns (uint256)
    {
        return userTaskCount[_user];
    }

    /**
     * @dev Get all task details for a user (including deleted)
     * @param _user The address of the user
     * @param _includeDeleted Whether to include deleted tasks
     * @return Array of Task structs
     */
    function getUserTaskDetails(address _user, bool _includeDeleted)
        external
        view
        returns (Task[] memory)
    {
        uint256[] memory taskIds = userTasks[_user];
        
        if (_includeDeleted) {
            Task[] memory allTasks = new Task[](taskIds.length);
            for (uint256 i = 0; i < taskIds.length; i++) {
                allTasks[i] = tasks[taskIds[i]];
            }
            return allTasks;
        } else {
            // Count non-deleted tasks
            uint256 activeCount = 0;
            for (uint256 i = 0; i < taskIds.length; i++) {
                if (!tasks[taskIds[i]].deleted) {
                    activeCount++;
                }
            }
            
            Task[] memory activeTasks = new Task[](activeCount);
            uint256 index = 0;
            for (uint256 i = 0; i < taskIds.length; i++) {
                if (!tasks[taskIds[i]].deleted) {
                    activeTasks[index] = tasks[taskIds[i]];
                    index++;
                }
            }
            return activeTasks;
        }
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

    /**
     * @dev Check if a task is deleted
     * @param _taskId The ID of the task
     * @return Boolean indicating deletion status
     */
    function isTaskDeleted(uint256 _taskId)
        external
        view
        taskExists(_taskId)
        returns (bool)
    {
        return tasks[_taskId].deleted;
    }

    /**
     * @dev Get contract status information
     * @return isPaused Contract pause status
     * @return isCircuitBreakerActive Circuit breaker status
     * @return currentCooldown Current action cooldown
     * @return currentMaxTasks Current max tasks per user
     */
    function getContractStatus() 
        external 
        view 
        returns (
            bool isPaused,
            bool isCircuitBreakerActive,
            uint256 currentCooldown,
            uint256 currentMaxTasks
        ) 
    {
        return (
            paused(),
            circuitBreakerActive,
            actionCooldown,
            maxTasksPerUser
        );
    }

    // ============ Emergency Functions ============
    /**
     * @dev Emergency withdrawal of contract balance (only ADMIN)
     * @param _recipient Address to receive the funds
     * @notice Only for emergency situations, uses pull pattern
     */
    function emergencyWithdraw(address _recipient) 
        external 
        onlyRole(ADMIN_ROLE) 
    {
        require(_recipient != address(0), "Invalid recipient");
        uint256 balance = address(this).balance - totalPendingWithdrawals;
        require(balance > 0, "No funds to withdraw");
        
        (bool success, ) = _recipient.call{value: balance}("");
        require(success, "Emergency withdrawal failed");
    }

    // ============ Upgradeability ============
    /**
     * @dev Authorize upgrade to new implementation
     * @param newImplementation Address of the new implementation contract
     * @notice Only UPGRADER role can upgrade the contract
     */
    function _authorizeUpgrade(address newImplementation)
        internal
        override
        onlyRole(UPGRADER_ROLE)
    {}

    /**
     * @dev Get the current implementation version
     * @return Version identifier
     */
    function version() external pure returns (string memory) {
        return "2.1.0";
    }

    // ============ Receive Function ============
    /**
     * @dev Receive function to accept ETH (for future payment features)
     */
    receive() external payable {}
}
