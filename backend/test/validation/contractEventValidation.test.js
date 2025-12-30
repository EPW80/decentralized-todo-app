/**
 * Contract Event Validation Tests
 *
 * Automatically validates that all sync scripts and services reference
 * the correct contract events. Prevents V1/V2 mismatches during upgrades.
 *
 * Run: npm test -- contractEventValidation.test.js
 */

const fs = require('fs');
const path = require('path');

describe('Contract Event Validation', () => {
  let contractABI;
  let contractEvents;

  beforeAll(() => {
    // Load the contract ABI
    const abiPath = path.join(__dirname, '../../../contracts/artifacts/contracts/TodoListV2.sol/TodoListV2.json');

    if (!fs.existsSync(abiPath)) {
      throw new Error(`Contract ABI not found at ${abiPath}. Run 'cd contracts && npx hardhat compile' first.`);
    }

    const artifact = JSON.parse(fs.readFileSync(abiPath, 'utf8'));
    contractABI = artifact.abi;

    // Extract task-related event names from ABI (filter out security/admin events)
    const taskEventPrefixes = ['Task'];
    contractEvents = contractABI
      .filter(item => item.type === 'event')
      .map(event => event.name)
      .filter(name => taskEventPrefixes.some(prefix => name.startsWith(prefix)));

    console.log('Task-related events found:', contractEvents);
  });

  describe('Contract ABI Events', () => {
    test('should have TaskCreated event (not TaskAdded)', () => {
      expect(contractEvents).toContain('TaskCreated');
      expect(contractEvents).not.toContain('TaskAdded');
    });

    test('should have TaskCompleted event', () => {
      expect(contractEvents).toContain('TaskCompleted');
    });

    test('should have TaskDeleted event', () => {
      expect(contractEvents).toContain('TaskDeleted');
    });

    test('should have TaskRestored event', () => {
      expect(contractEvents).toContain('TaskRestored');
    });

    test('should not have any V1 events', () => {
      const v1Events = ['TaskAdded', 'TaskUpdated'];
      v1Events.forEach(event => {
        expect(contractEvents).not.toContain(event);
      });
    });
  });

  describe('Blockchain Service Event References', () => {
    let serviceCode;

    beforeAll(() => {
      const servicePath = path.join(__dirname, '../../src/services/blockchainService.js');
      serviceCode = fs.readFileSync(servicePath, 'utf8');
    });

    test('should reference TaskCreated (not TaskAdded)', () => {
      expect(serviceCode).toContain('TaskCreated');
      expect(serviceCode).not.toMatch(/TaskAdded(?!\/TaskCompleted)/);
    });

    test('should have syncTaskCreated method (not handleTaskAdded)', () => {
      expect(serviceCode).toContain('syncTaskCreated');
      expect(serviceCode).not.toContain('handleTaskAdded');
    });

    test('should have syncTaskCompleted method', () => {
      expect(serviceCode).toContain('syncTaskCompleted');
    });

    test('should have syncTaskDeleted method', () => {
      expect(serviceCode).toContain('syncTaskDeleted');
    });

    test('should have syncTaskRestored method', () => {
      expect(serviceCode).toContain('syncTaskRestored');
    });

    test('should validate events against contract ABI', () => {
      expect(serviceCode).toContain('validateContractEvents');

      const expectedEventsMatch = /expectedEvents\s*=\s*\[([\s\S]*?)\]/;
      const match = serviceCode.match(expectedEventsMatch);

      if (match) {
        const expectedEvents = match[1]
          .split(',')
          .map(e => e.trim().replace(/['"]/g, ''))
          .filter(e => e);

        contractEvents.forEach(eventName => {
          expect(expectedEvents).toContain(eventName);
        });
      }
    });
  });

  describe('Sync Script Event References', () => {
    describe('Script: syncSpecificBlock.js', () => {
      let scriptCode;

      beforeAll(() => {
        const scriptPath = path.join(__dirname, '../../src/scripts/syncSpecificBlock.js');
        scriptCode = fs.readFileSync(scriptPath, 'utf8');
      });

      test('should reference TaskCreated (not TaskAdded)', () => {
        expect(scriptCode).toContain('TaskCreated');
        expect(scriptCode).not.toContain('TaskAdded');
      });

      test('should use syncTaskCreated (not handleTaskAdded)', () => {
        expect(scriptCode).toContain('syncTaskCreated');
        expect(scriptCode).not.toContain('handleTaskAdded');
      });

      test('should have correct method calls for all events', () => {
        const methodMappings = {
          'TaskCreated': 'syncTaskCreated',
          'TaskCompleted': 'syncTaskCompleted',
          'TaskDeleted': 'syncTaskDeleted',
          'TaskRestored': 'syncTaskRestored'
        };

        Object.entries(methodMappings).forEach(([event, method]) => {
          if (scriptCode.includes(event)) {
            expect(scriptCode).toContain(method);
          }
        });
      });
    });
  });

  describe('Event Filter Usage', () => {
    let serviceCode;

    beforeAll(() => {
      const servicePath = path.join(__dirname, '../../src/services/blockchainService.js');
      serviceCode = fs.readFileSync(servicePath, 'utf8');
    });

    test('should handle all contract events via listeners or filters', () => {
      contractEvents.forEach(eventName => {
        // Events can be handled either via filters or direct listeners
        // Check for either pattern
        const filterPattern = new RegExp(`filters\\.${eventName}\\(\\)`);
        const listenerPattern = new RegExp(`on\\(['"]${eventName}['"]`);

        const hasFilter = filterPattern.test(serviceCode);
        const hasListener = listenerPattern.test(serviceCode);

        expect(hasFilter || hasListener).toBe(true);
      });
    });
  });

  describe('Event Handler Registration', () => {
    let serviceCode;

    beforeAll(() => {
      const servicePath = path.join(__dirname, '../../src/services/blockchainService.js');
      serviceCode = fs.readFileSync(servicePath, 'utf8');
    });

    test('should register handlers for all contract events', () => {
      contractEvents.forEach(eventName => {
        const handlerPattern = new RegExp(`on\\(['"]${eventName}['"]`);
        expect(serviceCode).toMatch(handlerPattern);
      });
    });

    test('should have handler removal for all contract events', () => {
      contractEvents.forEach(eventName => {
        const offPattern = new RegExp(`off\\(['"]${eventName}['"]`);
        expect(serviceCode).toMatch(offPattern);
      });
    });
  });

  describe('Event Parameter Validation', () => {
    let serviceCode;

    beforeAll(() => {
      const servicePath = path.join(__dirname, '../../src/services/blockchainService.js');
      serviceCode = fs.readFileSync(servicePath, 'utf8');
    });

    test('TaskCreated should have correct parameters', () => {
      const event = contractABI.find(item => item.type === 'event' && item.name === 'TaskCreated');
      expect(event).toBeDefined();

      const paramNames = event.inputs.map(input => input.name);
      expect(paramNames).toEqual(['taskId', 'owner', 'description', 'timestamp']);

      const handlerMatch = serviceCode.match(/taskCreated:\s*async\s*\(([^)]+)\)/);
      expect(handlerMatch).toBeTruthy();

      const handlerParams = handlerMatch[1].split(',').map(p => p.trim());
      expect(handlerParams).toContain('taskId');
      expect(handlerParams).toContain('owner');
      expect(handlerParams).toContain('description');
      expect(handlerParams).toContain('timestamp');
    });

    test('TaskCompleted should have correct parameters', () => {
      const event = contractABI.find(item => item.type === 'event' && item.name === 'TaskCompleted');
      expect(event).toBeDefined();

      const paramNames = event.inputs.map(input => input.name);
      expect(paramNames).toEqual(['taskId', 'owner', 'timestamp']);
    });

    test('TaskDeleted should have correct parameters', () => {
      const event = contractABI.find(item => item.type === 'event' && item.name === 'TaskDeleted');
      expect(event).toBeDefined();

      const paramNames = event.inputs.map(input => input.name);
      expect(paramNames).toEqual(['taskId', 'owner', 'timestamp']);
    });

    test('TaskRestored should have correct parameters', () => {
      const event = contractABI.find(item => item.type === 'event' && item.name === 'TaskRestored');
      expect(event).toBeDefined();

      const paramNames = event.inputs.map(input => input.name);
      expect(paramNames).toEqual(['taskId', 'owner', 'timestamp']);
    });
  });

  describe('Configuration File Event References', () => {
    test('should load correct contract ABI', () => {
      const configPath = path.join(__dirname, '../../src/config/blockchain.js');
      const configCode = fs.readFileSync(configPath, 'utf8');

      expect(configCode).toContain('TodoListV2.sol');
      expect(configCode).not.toContain('TodoList.sol');
    });
  });
});

describe('Migration Safety Checks', () => {
  test('should not have any TodoList V1 contract files', () => {
    const v1Paths = [
      path.join(__dirname, '../../../contracts/contracts/TodoList.sol'),
      path.join(__dirname, '../../../contracts/artifacts/contracts/TodoList.sol')
    ];

    v1Paths.forEach(v1Path => {
      const exists = fs.existsSync(v1Path);
      expect(exists).toBe(false);
    });
  });

  test('should have deployment files named correctly', () => {
    const deploymentsDir = path.join(__dirname, '../../../contracts/deployments');

    if (fs.existsSync(deploymentsDir)) {
      const files = fs.readdirSync(deploymentsDir);

      files.forEach(file => {
        if (file.startsWith('deployment-')) {
          expect(file).toMatch(/^deployment-\d+\.json$/);

          const deploymentPath = path.join(deploymentsDir, file);
          const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));

          if (deployment.contracts) {
            expect(deployment.contracts).toHaveProperty('TodoListV2');
            expect(deployment.contracts).not.toHaveProperty('TodoList');
          }
        }
      });
    }
  });

  test('should not reference obsolete sync methods anywhere', () => {
    const filesToCheck = [
      path.join(__dirname, '../../src/services/blockchainService.js'),
      path.join(__dirname, '../../src/scripts/syncSpecificBlock.js')
    ];

    const obsoleteMethods = [
      'handleTaskAdded',
      'handleTaskUpdated',
      'syncTaskAdded',
      'syncTaskUpdated'
    ];

    filesToCheck.forEach(filePath => {
      if (fs.existsSync(filePath)) {
        const code = fs.readFileSync(filePath, 'utf8');

        obsoleteMethods.forEach(method => {
          expect(code).not.toContain(method);
        });
      }
    });
  });
});
