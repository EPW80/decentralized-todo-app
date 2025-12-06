# Advanced Transaction Status Visualization

Complete transaction tracking and visualization system for blockchain operations.

## 🎯 Overview

A comprehensive set of components that visualize the entire lifecycle of blockchain transactions, from initiation through final confirmation and sync.

## 📊 Transaction Stages

### Multi-Stage Flow
```
Initiated → Pending → Confirming → Confirmed → Synced
```

**Stage Definitions:**

1. **Initiated** (🔄)
   - User approved transaction in wallet
   - Waiting for network submission
   - Color: Blue `#3b82f6`

2. **Pending** (⏳)
   - Transaction submitted to network
   - In mempool awaiting mining
   - Color: Orange `#f59e0b`

3. **Confirming** (⛓️)
   - Mined into a block
   - Accumulating confirmations
   - Shows block number and confirmation count
   - Color: Purple `#8b5cf6`

4. **Confirmed** (✅)
   - Required confirmations reached
   - Transaction finalized on blockchain
   - Color: Green `#10b981`

5. **Synced** (💾)
   - Data synchronized with backend
   - Available in database
   - Color: Cyan `#06b6d4`

6. **Failed** (❌)
   - Transaction reverted or rejected
   - Error details shown
   - Color: Red `#ef4444`

## 🎨 Visual Components

### 1. Confirmation Progress Bar

**Features:**
- 5-stage horizontal progress indicator
- Each stage represented by numbered circle
- Current stage pulses and glows
- Overall progress bar with shimmer effect
- Detailed confirmation counter for "confirming" stage

**Visual States:**
- Inactive stages: Gray circles
- Active stages: Colored with network theme
- Current stage: Scaled up, pulsing white dot inside
- Completed stages: Numbered indicators

**Example Usage:**
```tsx
<ConfirmationProgress
  stage="confirming"
  confirmations={2}
  requiredConfirmations={3}
  blockNumber={18456789}
  showDetails={true}
/>
```

### 2. Animated Chain Links

**Features:**
- Visual chain links representing confirmations
- Links "connect" as confirmations arrive
- Active link pulses
- Completed chain shows checkmark
- Network-themed colors

**Visual Progression:**
- Gray faded links: Not yet confirmed
- Colored links: Confirmed
- Glowing center: Active confirmation
- Checkmark: All confirmations complete

**Example:**
```tsx
<ChainConfirmation
  confirmations={3}
  requiredConfirmations={5}
  animated={true}
/>
```

Renders: `🔗—🔗—🔗—⚪—⚪` → `🔗—🔗—🔗—🔗—🔗 ✅`

### 3. Gas Price Indicator

**Features:**
- Color-coded gas price levels
- Visual bar representation
- Level recommendations
- Multiple display variants

**Gas Levels:**
| Level | Range (Gwei) | Color | Icon | Recommendation |
|-------|-------------|-------|------|----------------|
| Low | <20 | Green | 🟢 | Great time to transact |
| Medium | 20-50 | Orange | 🟡 | Consider if urgent |
| High | 50-100 | Red | 🔴 | Wait if not urgent |
| Extreme | >100 | Purple | 🔥 | High fees, wait! |

**Variants:**
- **Compact**: Small badge with icon and price
- **Default**: Card with icon, price, and level
- **Detailed**: Full card with bar, recommendations, reference points

### 4. Transaction Timeline

**Features:**
- Vertical timeline of events
- Stage-specific colors and icons
- Relative timestamps ("2m ago")
- Transaction hash links
- Block numbers
- Current stage highlighted and pulsing

**Timeline Events:**
```typescript
{
  stage: 'confirming',
  timestamp: 1701234567890,
  message: 'Waiting for confirmations',
  txHash: '0x123...abc',
  blockNumber: 18456789
}
```

## 🎬 Visual Enhancements

### Progress Animations

1. **Shimmer Effect**
   - Flows across active progress bars
   - Indicates ongoing process
   - Subtle and non-distracting

2. **Pulse Animation**
   - Current stage indicator pulses
   - Active chain link pulses
   - Status dots animate

3. **Scale Transitions**
   - Current stage scales up
   - Smooth expansion on state change
   - Success states pop in

4. **Color Transitions**
   - Smooth color changes between stages
   - Network-themed gradients
   - Glow effects on active elements

### Block Confirmation Counter

Visual countdown display:
```
┌────────────────────────────┐
│ Block Confirmations        │
│ ━━━━━━━━━━░░░░░  2/3       │
│ 📦 Block #18,456,789       │
│ Waiting for confirmations••• │
└────────────────────────────┘
```

**Features:**
- Purple themed confirmation box
- Progress bar fills with confirmations
- Block number with cube icon
- Animated dots showing activity
- Percentage display in progress bar

## 💡 Usage Examples

### Basic Transaction Status

```tsx
import { ConfirmationProgress, ChainConfirmation } from './components/transaction';

const BasicStatus = ({ tx }) => (
  <div className="space-y-4">
    <ConfirmationProgress
      stage={tx.stage}
      confirmations={tx.confirmations}
      requiredConfirmations={3}
    />
    <ChainConfirmation
      confirmations={tx.confirmations}
      requiredConfirmations={3}
    />
  </div>
);
```

### With Gas Price

```tsx
import {
  ConfirmationProgress,
  GasPriceIndicator,
} from './components/transaction';

const StatusWithGas = ({ tx }) => (
  <div className="space-y-4">
    <ConfirmationProgress stage={tx.stage} {...tx} />
    <GasPriceIndicator
      gasPriceGwei={tx.gasPriceGwei}
      variant="detailed"
    />
  </div>
);
```

### Full Transaction Card

```tsx
import {
  ConfirmationProgress,
  ChainConfirmation,
  GasPriceIndicator,
  TransactionTimeline,
} from './components/transaction';

const FullTransactionCard = ({ tx }) => (
  <div className="glass-effect rounded-2xl p-6 space-y-6">
    {/* Main Progress */}
    <ConfirmationProgress
      stage={tx.stage}
      confirmations={tx.confirmations}
      requiredConfirmations={3}
      blockNumber={tx.blockNumber}
    />

    {/* Visual Chain */}
    <div className="flex justify-center py-4">
      <ChainConfirmation
        confirmations={tx.confirmations}
        requiredConfirmations={3}
      />
    </div>

    {/* Gas Info */}
    <GasPriceIndicator
      gasPriceGwei={tx.gasPriceGwei}
      variant="default"
    />

    {/* Timeline */}
    <TransactionTimeline
      events={tx.events}
      currentStage={tx.stage}
    />
  </div>
);
```

### Inline Compact View

```tsx
import { ChainConfirmation, GasPriceIndicator } from './components/transaction';

const CompactView = ({ tx }) => (
  <div className="flex items-center gap-4">
    <ChainConfirmation
      confirmations={tx.confirmations}
      requiredConfirmations={3}
      animated={true}
    />
    <GasPriceIndicator
      gasPriceGwei={tx.gasPriceGwei}
      variant="compact"
    />
  </div>
);
```

## 🔄 Real-Time Updates

### Listening for Confirmations

```typescript
import { useEffect, useState } from 'react';
import { ethers } from 'ethers';

const useTransactionStatus = (txHash: string, provider: ethers.Provider) => {
  const [status, setStatus] = useState({
    stage: 'pending' as TransactionStage,
    confirmations: 0,
    blockNumber: undefined,
  });

  useEffect(() => {
    const checkStatus = async () => {
      const tx = await provider.getTransaction(txHash);
      if (!tx) return;

      const receipt = await tx.wait(0);
      if (receipt) {
        const currentBlock = await provider.getBlockNumber();
        const confirmations = currentBlock - receipt.blockNumber + 1;

        setStatus({
          stage: confirmations >= 3 ? 'confirmed' : 'confirming',
          confirmations,
          blockNumber: receipt.blockNumber,
        });
      }
    };

    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, [txHash, provider]);

  return status;
};
```

## 📱 Responsive Design

All components are fully responsive:
- Mobile: Compact layouts, stacked elements
- Tablet: Balanced space usage
- Desktop: Full detail display

## ♿ Accessibility

- Semantic HTML structure
- ARIA labels on interactive elements
- Color AND icon/text indicators (not color-alone)
- Keyboard navigation support
- Screen reader friendly timestamps
- Sufficient color contrast

## 🎨 Theming

All components automatically use:
- Network-specific colors via `useNetworkTheme()`
- Stage-specific colors for clarity
- Consistent gradients and shadows
- Tailwind CSS utilities

## 📊 Analytics Potential

Track user engagement:
- Time spent in each stage
- Average confirmation times
- Gas price patterns
- Failed transaction reasons
- User behavior during delays

## 🚀 Performance

- Optimized re-renders
- CSS-based animations (GPU accelerated)
- Memoized utility functions
- Efficient event listeners
- Lazy loading for timeline

## 🔮 Future Enhancements

Potential additions:
- [ ] Estimated time to confirmation
- [ ] MEV protection indicators
- [ ] Transaction replacement options
- [ ] Historical gas price charts
- [ ] Notification system
- [ ] Sound effects for confirmations
- [ ] Confetti animation on success
