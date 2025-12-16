# Backend Improvements Testing Guide

## Overview

This guide provides comprehensive testing procedures for all Phase 1 and Phase 2 backend improvements.

---

## ✅ Pre-Test Checklist

### 1. Environment Setup

**Verify .env file exists:**
```bash
cd /home/erikwilliams/dev/decentralized-todo-app/backend
ls -la .env
```

**If .env doesn't exist, create it from example:**
```bash
cp .env.example .env
```

**Required environment variables to set:**
```bash
# Generate a secure JWT secret (minimum 32 characters)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Update .env with the generated secret
# JWT_SECRET=<generated_secret_here>

# Set MongoDB URI
# MONGODB_URI=mongodb://localhost:27017/decentralized-todo

# Set RPC URLs (for testing, localhost is fine)
# LOCALHOST_RPC=http://127.0.0.1:8545
```

### 2. Dependencies Check

**Ensure all dependencies are installed:**
```bash
npm install
```

**Verify no missing packages:**
```bash
npm list --depth=0
```

---

## 🧪 Phase 1 Tests: Security Improvements

### Test 1.1: JWT_SECRET Validation

**Test Case 1: Insecure JWT_SECRET (should warn in dev, exit in prod)**
```bash
# Set insecure secret in .env
JWT_SECRET=secret

# Test in development mode (should warn but continue)
NODE_ENV=development npm start

# Expected output:
# ⚠️  SECURITY ERROR: JWT_SECRET is not set or is insecure!
# ⚠️  Continuing in development mode with insecure JWT_SECRET
# ✓ Environment validation passed (with warnings)
```

**Test Case 2: Production with insecure secret (should exit)**
```bash
# Set insecure secret
JWT_SECRET=test

# Test in production mode (should exit with error)
NODE_ENV=production npm start

# Expected output:
# ⚠️  SECURITY ERROR: JWT_SECRET is not set or is insecure!
# Exiting due to security risk in production...
# (Process exits with code 1)
```

**Test Case 3: Secure JWT_SECRET (should pass)**
```bash
# Set secure secret (32+ characters)
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

# Start server
npm start

# Expected output:
# ✓ Environment validation passed
# ✓ MongoDB connected successfully
# ✓ Blockchain service initialized
# ✓ Server running on port 5000
```

**✅ Pass Criteria:**
- [ ] Insecure secrets detected in both dev and prod
- [ ] Dev mode continues with warning
- [ ] Prod mode exits with error
- [ ] Secure secrets allow startup

---

### Test 1.2: Input Validation Middleware

**Test Case 1: Valid sync request**
```bash
curl -X POST http://localhost:5000/api/todos/sync \
  -H "Content-Type: application/json" \
  -d '{"chainId": 31337, "blockchainId": "1"}'

# Expected: Success (if blockchain is running) or blockchain error
# Should NOT return validation error
```

**Test Case 2: Invalid sync request - missing chainId**
```bash
curl -X POST http://localhost:5000/api/todos/sync \
  -H "Content-Type: application/json" \
  -d '{"blockchainId": "1"}'

# Expected output:
# {
#   "success": false,
#   "error": "Validation failed",
#   "errors": [{"msg": "chainId must be a valid positive integer"}]
# }
```

**Test Case 3: Invalid sync request - invalid chainId type**
```bash
curl -X POST http://localhost:5000/api/todos/sync \
  -H "Content-Type: application/json" \
  -d '{"chainId": "not-a-number", "blockchainId": "1"}'

# Expected: Validation error for chainId
```

**Test Case 4: Invalid restore request - invalid MongoDB ID**
```bash
curl -X POST http://localhost:5000/api/todos/restore \
  -H "Content-Type: application/json" \
  -d '{"id": "not-a-valid-mongodb-id"}'

# Expected output:
# {
#   "success": false,
#   "error": "Validation failed",
#   "errors": [{"msg": "id must be a valid MongoDB ObjectId"}]
# }
```

**✅ Pass Criteria:**
- [ ] Valid requests pass validation
- [ ] Invalid requests return 400 with clear error messages
- [ ] All validation rules work as expected

---

### Test 1.3: CORS Configuration

**Test Case 1: Allowed origin**
```bash
# If CORS_ORIGIN=http://localhost:3000 in .env
curl -X GET http://localhost:5000/api/health \
  -H "Origin: http://localhost:3000" \
  -v 2>&1 | grep -i "access-control"

# Expected: Should see Access-Control-Allow-Origin header
```

**Test Case 2: Unauthorized origin**
```bash
curl -X GET http://localhost:5000/api/health \
  -H "Origin: http://evil-site.com" \
  -v 2>&1 | grep -i "access-control"

# Expected: No CORS headers or error
# Check server logs for:
# ⚠️  Blocked CORS request from unauthorized origin: http://evil-site.com
```

**Test Case 3: Multiple origins**
```bash
# Set in .env:
# CORS_ORIGIN=http://localhost:3000,http://localhost:3001

# Restart server, then test both origins
curl -X GET http://localhost:5000/api/health -H "Origin: http://localhost:3000"
curl -X GET http://localhost:5000/api/health -H "Origin: http://localhost:3001"

# Expected: Both should be allowed
```

**✅ Pass Criteria:**
- [ ] Allowed origins work correctly
- [ ] Unauthorized origins are blocked
- [ ] Multiple origins (comma-separated) work
- [ ] Warnings logged for blocked requests

---

### Test 1.4: Endpoint-Specific Rate Limiting

**Test Case 1: Standard rate limit (100 req/15 min)**
```bash
# Make 101 requests quickly
for i in {1..101}; do
  curl -s http://localhost:5000/api/health -o /dev/null -w "%{http_code}\n"
  sleep 0.1
done

# Expected: First 100 return 200, 101st returns 429
```

**Test Case 2: Strict rate limit on expensive operations (10 req/15 min)**
```bash
# Make 11 verify requests quickly
for i in {1..11}; do
  curl -s "http://localhost:5000/api/todos/verify/507f1f77bcf86cd799439011" \
    -o /dev/null -w "%{http_code}\n"
  sleep 0.1
done

# Expected: First 10 return 200/404, 11th returns 429
# Response body should be:
# {"success": false, "error": "Too many requests for this operation, please try again later."}
```

**✅ Pass Criteria:**
- [ ] Standard endpoints limited to 100/15min
- [ ] Expensive endpoints limited to 10/15min
- [ ] Rate limit returns 429 status
- [ ] Error messages are JSON formatted

---

### Test 1.5: Enhanced Graceful Shutdown

**Test Case 1: SIGINT shutdown**
```bash
# Start server
npm start

# In another terminal, send SIGINT
pkill -SIGINT -f "node src/index.js"

# Expected output in original terminal:
# SIGINT received, starting graceful shutdown...
# Cleaning up blockchain service...
# Closing MongoDB connection...
# ✓ HTTP server closed
# ✓ MongoDB connection closed
# ✓ Graceful shutdown completed
```

**Test Case 2: Shutdown timeout (manual test)**
```bash
# This requires modifying code temporarily to simulate hanging
# Skip for now - covered by code review
```

**✅ Pass Criteria:**
- [ ] SIGINT/SIGTERM triggers shutdown
- [ ] All services cleaned up in order
- [ ] Process exits cleanly (code 0)
- [ ] 30-second timeout enforced

---

## 🔗 Phase 2 Tests: Blockchain Reliability

### Test 2.1: Event Recovery on Startup

**Setup: Create test scenario**
```bash
# 1. Start backend with blockchain running
npm start

# 2. Create some todos via frontend or API

# 3. Stop backend (Ctrl+C)

# 4. Create more todos directly on blockchain (using frontend without backend)
#    OR wait a few minutes

# 5. Restart backend
npm start
```

**Expected behavior:**
```
✓ MongoDB connected successfully
🔄 Recovering events for chain 31337 from block 12345 to 12350...
✓ Event recovery completed for chain 31337
✓ Blockchain service initialized
```

**Verify recovery:**
```bash
# Check logs for:
# - "🔄 Recovering events" message
# - "✓ Event recovery completed" message
# - Number of events recovered

# Query API to verify todos were synced
curl http://localhost:5000/api/todos/0xYourAddress
```

**Test Case: No recovery needed (already up to date)**
```bash
# Stop and immediately restart backend
npm start

# Expected output:
# ✓ Chain 31337 is up to date, no event recovery needed
```

**✅ Pass Criteria:**
- [ ] Missed events recovered on startup
- [ ] Recovery skipped when up to date
- [ ] No errors during recovery
- [ ] All todos appear in database after recovery

---

### Test 2.2: RPC Failover

**Setup: Configure backup RPC**
```bash
# In .env, add:
LOCALHOST_RPC=http://127.0.0.1:8545
LOCALHOST_RPC_BACKUP=http://127.0.0.1:8545  # Same for testing

# For real test, use different providers:
# ETHEREUM_SEPOLIA_RPC=https://sepolia.infura.io/v3/YOUR_KEY
# ETHEREUM_SEPOLIA_RPC_BACKUP=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
```

**Test Case 1: Backup configured**
```bash
# Start server
npm start

# Expected log output:
# Setting up failover for localhost with 2 RPC endpoints
# ✓ Connected to localhost (chainId: 31337, confirmations: 1)
```

**Test Case 2: Single RPC (no backup)**
```bash
# In .env, remove backup:
# LOCALHOST_RPC_BACKUP=

# Restart
npm start

# Expected: Should NOT see "Setting up failover" message
# Should use single JsonRpcProvider
```

**Test Case 3: Failover during runtime (requires network simulation)**
```bash
# This test requires:
# 1. Two different RPC endpoints (primary + backup)
# 2. Ability to disconnect primary during runtime
# 3. Verify backup takes over

# Manual test - monitor logs during RPC failure
# Expected: Automatic failover to backup with no service interruption
```

**✅ Pass Criteria:**
- [ ] Failover configured when backup RPC provided
- [ ] Single provider when no backup
- [ ] Log messages indicate failover setup
- [ ] Automatic failover on primary failure (advanced test)

---

### Test 2.3: Event Listener Memory Leak Fix

**Test Case 1: Multiple reconnections**
```bash
# Start server
npm start

# Monitor memory usage
# In another terminal:
watch -n 5 'ps aux | grep "node src/index.js" | grep -v grep | awk "{print \$6}"'

# Simulate multiple reconnections by:
# - Restarting blockchain node multiple times
# - OR modifying code to trigger reconnect every 10 seconds

# Expected: Memory usage should remain stable
# Should see in logs:
# 🗑️  Removed old event listeners for chain 31337
```

**Test Case 2: Handler cleanup**
```bash
# Start with debug logging to verify handler management
# Check logs for:
# - "🗑️  Removed old event listeners" before new listeners added
# - No duplicate event processing
# - Clean shutdown without memory warnings
```

**✅ Pass Criteria:**
- [ ] Old listeners removed before adding new ones
- [ ] Memory usage stable over time
- [ ] No duplicate event processing
- [ ] Clean shutdown with no warnings

---

## 🏥 Health Check Tests

**Test Case 1: Basic health check**
```bash
curl http://localhost:5000/api/health | jq

# Expected output:
# {
#   "status": "ok",
#   "database": { "connected": true },
#   "blockchain": {
#     "31337": {
#       "name": "unknown",
#       "chainId": 31337,
#       "blockNumber": 12345,
#       "contractAddress": "0x..."
#     }
#   }
# }
```

**✅ Pass Criteria:**
- [ ] Health endpoint returns 200
- [ ] Database status shown
- [ ] Blockchain networks listed
- [ ] All active chains reported

---

## 🔧 Integration Tests

### Full Stack Test Scenario

**Scenario: Create, Complete, and Verify Todo**

```bash
# 1. Start blockchain node (if using hardhat)
cd ../../contracts
npx hardhat node

# 2. Deploy contract (if needed)
npx hardhat run scripts/deploy.js --network localhost

# 3. Start backend
cd ../backend
npm start

# 4. Create todo via API (requires blockchain transaction)
# Use frontend or contract interaction

# 5. Verify event was caught and synced
# Check logs for:
# [31337] TaskCreated event: { taskId: '1', owner: '0x...', ... }
# ✓ Synced TaskCreated: 1 on chain 31337

# 6. Query API to verify todo exists
curl http://localhost:5000/api/todos/0xYourAddress | jq

# 7. Stop backend (Ctrl+C)

# 8. Create another todo on blockchain

# 9. Restart backend
npm start

# 10. Verify event recovery synced the missed todo
# Check logs for recovery message
# Query API to confirm both todos exist
```

**✅ Pass Criteria:**
- [ ] Events caught in real-time
- [ ] Todos synced to MongoDB
- [ ] API returns correct data
- [ ] Event recovery works after restart
- [ ] No data loss

---

## 📋 Summary Checklist

### Phase 1: Security
- [ ] JWT_SECRET validation working
- [ ] Input validation on all POST endpoints
- [ ] CORS configuration correct
- [ ] Rate limiting enforced
- [ ] Graceful shutdown functional

### Phase 2: Blockchain Reliability
- [ ] Event recovery on startup
- [ ] RPC failover configured
- [ ] Memory leak fixed
- [ ] Chain-specific configs working

### General
- [ ] All syntax valid
- [ ] No console errors on startup
- [ ] Health check endpoint working
- [ ] MongoDB connection stable
- [ ] Blockchain events syncing

---

## 🐛 Common Issues & Solutions

### Issue 1: "JWT_SECRET is not set"
**Solution:** Create `.env` file from `.env.example` and set a 32+ character secret

### Issue 2: "Cannot connect to MongoDB"
**Solution:**
```bash
# Ensure MongoDB is running
sudo systemctl start mongodb
# OR
mongod --dbpath /path/to/data
```

### Issue 3: "No contract deployed"
**Solution:**
```bash
cd ../contracts
npx hardhat run scripts/deploy.js --network localhost
```

### Issue 4: Event recovery fails
**Symptoms:** Errors during startup event recovery
**Solution:** Check that blockchain node is accessible and contract is deployed

### Issue 5: Rate limit too strict
**Temporary solution:** Increase limits in `.env`:
```bash
RATE_LIMIT_MAX_REQUESTS=1000
```

---

## 📊 Performance Benchmarks

### Expected Performance Metrics

**Startup Time:**
- Without recovery: < 2 seconds
- With recovery (100 events): < 5 seconds
- With recovery (1000 events): < 30 seconds

**API Response Times:**
- Health check: < 50ms
- Get todos: < 100ms
- Verify todo: < 500ms (blockchain call)

**Memory Usage:**
- Baseline: ~100-150 MB
- After 1 hour: < 200 MB (should not grow)
- After 24 hours: < 300 MB

**Event Processing:**
- Real-time sync: < 1 second after blockchain confirmation
- Recovery sync: ~10-50 events/second

---

## 🎯 Next Steps After Testing

Once all tests pass:

1. **Document any issues found** in GitHub issues
2. **Update .env.example** if needed
3. **Consider Phase 3 improvements**:
   - Structured logging (Winston)
   - Enhanced health checks
   - Jest testing infrastructure
4. **Deploy to staging environment**
5. **Run extended load tests**

---

## 📞 Getting Help

If tests fail or you need assistance:

1. Check logs in console output
2. Review this guide for common issues
3. Verify environment variables are set correctly
4. Check MongoDB and blockchain node are running
5. Review the implementation plan for expected behavior

---

**Testing completed successfully?** 🎉

You now have a production-ready backend with:
- ✅ Enhanced security
- ✅ Blockchain reliability
- ✅ Event recovery
- ✅ RPC failover
- ✅ Memory leak prevention
