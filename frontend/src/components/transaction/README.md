
# Transaction Status Visualization Components

Advanced components for visualizing blockchain transaction states, confirmations, and gas prices.

## Components

### 1. ConfirmationProgress

Multi-stage progress indicator for transaction lifecycle.

```tsx
import { ConfirmationProgress } from './transaction';

<ConfirmationProgress
  stage="confirming"
  confirmations={2}
  requiredConfirmations={3}
  blockNumber={12345678}
  showDetails={true}
/>
```

**Transaction Stages:**
- `initiated` - User approved in wallet
- `pending` - Submitted to network
- `confirming` - Waiting for block confirmations
- `confirmed` - Required confirmations reached
- `synced` - Data synced with backend
- `failed` - Transaction failed

**Props:**
- `stage`: TransactionStage - Current transaction stage
- `confirmations`: number - Number of confirmations received
- `requiredConfirmations`: number - Number of confirmations needed
- `blockNumber?`: number - Current block number
- `showDetails?`: boolean - Show detailed confirmation info (default: true)

**Features:**
- 5-stage progress bar with smooth transitions
- Animated stage indicators
- Real-time confirmation counter
- Block number display
- Success/failure states
- Shimmer loading effects

### 2. ChainConfirmation

Animated chain link visualization showing confirmation progress.

```tsx
import { ChainConfirmation } from './transaction';

<ChainConfirmation
  confirmations={2}
  requiredConfirmations={5}
  animated={true}
/>
```

**Props:**
- `confirmations`: number - Current confirmations
- `requiredConfirmations`: number - Total confirmations needed
- `animated?`: boolean - Enable animations (default: true)

**Features:**
- Visual chain links that "connect" as confirmations arrive
- Pulsing animation on active link
- Checkmark on completion
- Network-themed colors
- Glow effects

### 3. GasPriceIndicator

Color-coded gas price display with recommendations.

```tsx
import { GasPriceIndicator } from './transaction';

// Compact variant
<GasPriceIndicator
  gasPriceGwei={35.5}
  variant="compact"
  showLabel={true}
/>

// Default variant
<GasPriceIndicator
  gasPriceGwei={35.5}
  variant="default"
/>

// Detailed variant
<GasPriceIndicator
  gasPriceGwei={35.5}
  variant="detailed"
/>
```

**Gas Price Levels:**
- 🟢 **Low** (<20 Gwei) - Green
- 🟡 **Medium** (20-50 Gwei) - Orange
- 🔴 **High** (50-100 Gwei) - Red
- 🔥 **Extreme** (>100 Gwei) - Purple

**Props:**
- `gasPriceGwei`: number - Gas price in Gwei
- `variant?`: 'default' | 'compact' | 'detailed' - Display style
- `showLabel?`: boolean - Show price label (default: true)

**Features:**
- Color-coded levels with emojis
- Visual progress bar
- Recommendations based on level
- Reference price points
- Compact and detailed views

### 4. TransactionTimeline

Historical timeline of transaction events.

```tsx
import { TransactionTimeline } from './transaction';

const events = [
  {
    stage: 'initiated',
    timestamp: Date.now() - 60000,
    message: 'Transaction initiated',
  },
  {
    stage: 'pending',
    timestamp: Date.now() - 45000,
    message: 'Submitted to network',
    txHash: '0x123...',
  },
  {
    stage: 'confirming',
    timestamp: Date.now() - 30000,
    message: 'Waiting for confirmations',
    blockNumber: 12345678,
  },
];

<TransactionTimeline
  events={events}
  currentStage="confirming"
  compact={false}
/>
```

**Props:**
- `events`: TimelineEvent[] - Array of transaction events
- `currentStage`: TransactionStage - Current stage
- `compact?`: boolean - Compact view (default: false)

**TimelineEvent Interface:**
```typescript
interface TimelineEvent {
  stage: TransactionStage;
  timestamp: number;
  message: string;
  txHash?: string;
  blockNumber?: number;
}
```

**Features:**
- Vertical timeline with connecting line
- Stage-specific colors and icons
- Relative and absolute timestamps
- Transaction hash links
- Block number display
- Animated current stage indicator
- Compact and detailed views

## Types and Utilities

### TransactionStage

```typescript
type TransactionStage =
  | 'initiated'
  | 'pending'
  | 'confirming'
  | 'confirmed'
  | 'synced'
  | 'failed';
```

### Utility Functions

```typescript
import {
  getStageProgress,
  getStageLabel,
  getStageIcon,
  getStageColor,
  getGasPriceLevel,
} from '../../types/transaction';

// Get progress percentage (0-100)
const progress = getStageProgress('confirming'); // 50

// Get human-readable label
const label = getStageLabel('confirming'); // "Confirming"

// Get emoji icon
const icon = getStageIcon('confirming'); // "⛓️"

// Get hex color
const color = getStageColor('confirming'); // "#8b5cf6"

// Get gas price level with details
const gasLevel = getGasPriceLevel(35.5);
// {
//   level: 'medium',
//   color: '#f59e0b',
//   label: 'Medium',
//   icon: '🟡'
// }
```

## Complete Example

### Transaction Status Card

```tsx
import React, { useState } from 'react';
import {
  ConfirmationProgress,
  ChainConfirmation,
  GasPriceIndicator,
  TransactionTimeline,
} from './components/transaction';

const TransactionCard = () => {
  const [stage, setStage] = useState<TransactionStage>('confirming');
  const [confirmations, setConfirmations] = useState(2);

  return (
    <div className="space-y-6">
      {/* Main Progress */}
      <ConfirmationProgress
        stage={stage}
        confirmations={confirmations}
        requiredConfirmations={3}
        blockNumber={12345678}
      />

      {/* Chain Visualization */}
      <div className="flex justify-center">
        <ChainConfirmation
          confirmations={confirmations}
          requiredConfirmations={3}
          animated={true}
        />
      </div>

      {/* Gas Price */}
      <GasPriceIndicator
        gasPriceGwei={35.5}
        variant="detailed"
      />

      {/* Timeline */}
      <TransactionTimeline
        events={[
          {
            stage: 'initiated',
            timestamp: Date.now() - 120000,
            message: 'Transaction initiated',
          },
          {
            stage: 'pending',
            timestamp: Date.now() - 90000,
            message: 'Submitted to network',
            txHash: '0x1234567890abcdef...',
          },
          {
            stage: 'confirming',
            timestamp: Date.now() - 60000,
            message: 'Waiting for confirmations',
            blockNumber: 12345678,
          },
        ]}
        currentStage={stage}
      />
    </div>
  );
};
```

## Styling

All components use:
- Network-specific theming via `useNetworkTheme()` hook
- Tailwind CSS for styling
- Smooth animations and transitions
- Responsive design
- Accessibility features

## Animations

- **Shimmer**: Progress bars have flowing shimmer effect
- **Pulse**: Active stages pulse
- **Scale**: Success states scale in
- **Ping**: Status indicators ping
- **Chain Connect**: Links animate as they confirm

## Performance

- Lightweight components
- Optimized re-renders
- CSS-based animations
- Memoization where needed

## Accessibility

- Semantic HTML
- ARIA labels
- Color AND icon indicators
- Keyboard navigation support
- Screen reader friendly
