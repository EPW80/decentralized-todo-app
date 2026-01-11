# Development Quick Start Guide

## 🚀 Easy Start (Recommended)

### Start Everything
```bash
./start-dev.sh
```

This single command will:
1. ✓ Start the Hardhat local blockchain
2. ✓ Deploy smart contracts
3. ✓ Auto-sync contract addresses to frontend
4. ✓ Start the backend server
5. ✓ Start the frontend development server

Then open http://localhost:5173 in your browser!

### Stop Everything
```bash
./stop-dev.sh
```

---

## 🛠️ Manual Start (For more control)

### Terminal 1: Start Hardhat Node
```bash
cd contracts
npm run dev
```

### Terminal 2: Deploy Contracts & Start Backend
```bash
# Deploy and auto-sync
cd contracts
npm run deploy:sync

# Start backend
cd ..
npm run dev:backend
```

### Terminal 3: Start Frontend
```bash
npm run dev:frontend
```

---

## 📝 Common Tasks

### Deploy Contracts After Restart
When you restart Hardhat node, you need to redeploy:
```bash
cd contracts
npm run deploy:sync
```
This automatically updates the frontend `.env` file!

### Manual Sync (If needed)
If you manually deploy contracts:
```bash
cd contracts
npm run sync:frontend
```

### Check Services
```bash
# Backend health
curl http://localhost:5000/api/health

# View logs
tail -f /tmp/hardhat.log
tail -f /tmp/backend.log
tail -f /tmp/frontend.log
```

---

## 🔧 Troubleshooting

### "Contract address mismatch"
Run the sync command:
```bash
cd contracts && npm run sync:frontend
```

### Services won't start
Clean up ports and restart:
```bash
./stop-dev.sh
./start-dev.sh
```

### Hardhat node crashed
Check the logs:
```bash
tail -f /tmp/hardhat.log
```

---

## 📚 Key URLs

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:5000/api
- **Blockchain RPC:** http://localhost:8545
- **Health Check:** http://localhost:5000/api/health

---

## 💡 Pro Tips

1. **No more manual config updates!** The `deploy:sync` command handles everything
2. **Use `./start-dev.sh`** for the fastest setup
3. **Keep Hardhat node running** to avoid re-deploying constantly
4. **Check health endpoint** to verify contract addresses match

---

Happy coding! 🎉
