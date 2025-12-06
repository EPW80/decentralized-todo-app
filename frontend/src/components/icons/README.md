# Web3 Icon Library

Comprehensive collection of Web3-specific icons, wallet logos, blockchain symbols, and illustrations for decentralized applications.

## 📦 Icon Categories

### 1. Wallet Icons (`./wallets`)

Professional wallet provider logos:

```tsx
import { MetaMaskIcon, WalletConnectIcon, CoinbaseWalletIcon } from './components/icons';

// Basic usage
<MetaMaskIcon size={40} />
<WalletConnectIcon size={40} />
<CoinbaseWalletIcon size={40} />

// With custom styling
<MetaMaskIcon
  size={48}
  className="hover:scale-110 transition-transform"
/>
```

**Available Wallets:**
- `MetaMaskIcon` - MetaMask fox logo (orange/brown)
- `WalletConnectIcon` - WalletConnect bridge logo (blue gradient)
- `CoinbaseWalletIcon` - Coinbase Wallet logo (blue)

### 2. Chain/Blockchain Logos (`./chains`)

Blockchain network logos with official colors:

```tsx
import {
  EthereumIcon,
  PolygonIcon,
  ArbitrumIcon,
  OptimismIcon
} from './components/icons';

// Network selector
<div className="flex gap-2">
  <EthereumIcon size={32} />
  <PolygonIcon size={32} />
  <ArbitrumIcon size={32} />
  <OptimismIcon size={32} />
</div>
```

**Available Chains:**
- `EthereumIcon` - ETH diamond logo (blue `#627EEA`)
- `PolygonIcon` - MATIC polygon logo (purple `#8247E5`)
- `ArbitrumIcon` - ARB logo (blue `#28A0F0`)
- `OptimismIcon` - OP logo (red `#FF0420`)

### 3. Action Icons (`./actions`)

Web3 operation icons:

```tsx
import { SendIcon, ReceiveIcon, SwapIcon, StakeIcon } from './components/icons';

// With colors
<SendIcon size={24} color="#10b981" />
<ReceiveIcon size={24} color="#3b82f6" />
<SwapIcon size={24} color="#8b5cf6" />
<StakeIcon size={24} color="#f59e0b" />
```

**Available Actions:**
- `SendIcon` - Send/Transfer (arrow outgoing)
- `ReceiveIcon` - Receive (arrow incoming + tray)
- `SwapIcon` - Token swap (double arrows)
- `StakeIcon` - Staking (stacked coins + lock)

### 4. Status Icons (`./status`)

Transaction status indicators:

```tsx
import { PendingIcon, ConfirmedIcon, FailedIcon } from './components/icons';

// Transaction status
<div className="flex items-center gap-2">
  <PendingIcon size={20} color="#f59e0b" />
  <span>Pending...</span>
</div>

<div className="flex items-center gap-2">
  <ConfirmedIcon size={20} color="#10b981" />
  <span>Confirmed</span>
</div>

<div className="flex items-center gap-2">
  <FailedIcon size={20} color="#ef4444" />
  <span>Failed</span>
</div>
```

**Available Status:**
- `PendingIcon` - Clock with pulsing center
- `ConfirmedIcon` - Checkmark in circle
- `FailedIcon` - X mark in circle

### 5. Empty State Illustrations (`./illustrations`)

Large illustrations for empty states:

```tsx
import {
  EmptyWalletIllustration,
  NoTodosIllustration,
  BlockchainIllustration
} from './components/icons';

// Empty wallet state
<div className="flex flex-col items-center p-12">
  <EmptyWalletIllustration size={200} />
  <h3>No Wallet Connected</h3>
  <p>Connect your wallet to get started</p>
</div>

// No todos state
<div className="flex flex-col items-center p-12">
  <NoTodosIllustration size={200} />
  <h3>No Tasks Yet</h3>
  <p>Create your first blockchain task!</p>
</div>

// Blockchain visualization
<BlockchainIllustration size={300} animated={true} />
```

**Available Illustrations:**
- `EmptyWalletIllustration` - Empty wallet with floating particles
- `NoTodosIllustration` - Clipboard with empty checkboxes + sparkles
- `BlockchainIllustration` - Connected blockchain blocks with nodes

## 🎨 Common Props

All icons support these common props:

```typescript
interface IconProps {
  size?: number | string;      // Icon size (default: 24)
  className?: string;          // Additional CSS classes
  color?: string;              // Icon color (currentColor by default)
  style?: React.CSSProperties; // Inline styles
}
```

## 💡 Usage Examples

### Wallet Selector

```tsx
import { MetaMaskIcon, WalletConnectIcon, CoinbaseWalletIcon } from './components/icons';

const WalletSelector = () => {
  const wallets = [
    { name: 'MetaMask', Icon: MetaMaskIcon },
    { name: 'WalletConnect', Icon: WalletConnectIcon },
    { name: 'Coinbase Wallet', Icon: CoinbaseWalletIcon },
  ];

  return (
    <div className="grid grid-cols-3 gap-4">
      {wallets.map(({ name, Icon }) => (
        <button
          key={name}
          className="p-4 rounded-xl border-2 hover:border-purple-500 transition-all"
        >
          <Icon size={48} />
          <p className="mt-2 text-sm">{name}</p>
        </button>
      ))}
    </div>
  );
};
```

### Network Badge

```tsx
import { EthereumIcon, PolygonIcon } from './components/icons';

const NetworkBadge = ({ chainId }) => {
  const networks = {
    1: { name: 'Ethereum', Icon: EthereumIcon, color: '#627EEA' },
    137: { name: 'Polygon', Icon: PolygonIcon, color: '#8247E5' },
  };

  const network = networks[chainId];

  return (
    <div
      className="flex items-center gap-2 px-3 py-2 rounded-lg"
      style={{ backgroundColor: `${network.color}20` }}
    >
      <network.Icon size={20} />
      <span style={{ color: network.color }}>{network.name}</span>
    </div>
  );
};
```

### Action Button

```tsx
import { SendIcon, SwapIcon } from './components/icons';

const ActionButtons = () => (
  <div className="flex gap-2">
    <button className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg">
      <SendIcon size={20} color="white" />
      <span>Send</span>
    </button>

    <button className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg">
      <SwapIcon size={20} color="white" />
      <span>Swap</span>
    </button>
  </div>
);
```

### Transaction Status

```tsx
import { PendingIcon, ConfirmedIcon, FailedIcon } from './components/icons';

const TransactionStatus = ({ status }) => {
  const statusConfig = {
    pending: {
      Icon: PendingIcon,
      color: '#f59e0b',
      label: 'Pending',
      bgColor: '#fef3c7',
    },
    confirmed: {
      Icon: ConfirmedIcon,
      color: '#10b981',
      label: 'Confirmed',
      bgColor: '#d1fae5',
    },
    failed: {
      Icon: FailedIcon,
      color: '#ef4444',
      label: 'Failed',
      bgColor: '#fee2e2',
    },
  };

  const config = statusConfig[status];

  return (
    <div
      className="inline-flex items-center gap-2 px-3 py-2 rounded-full"
      style={{ backgroundColor: config.bgColor }}
    >
      <config.Icon size={16} color={config.color} />
      <span style={{ color: config.color }} className="text-sm font-medium">
        {config.label}
      </span>
    </div>
  );
};
```

### Empty State

```tsx
import { NoTodosIllustration } from './components/icons';

const EmptyTodoList = () => (
  <div className="flex flex-col items-center justify-center p-12 text-center">
    <NoTodosIllustration size={240} />
    <h3 className="mt-6 text-2xl font-bold text-gray-900">
      All Caught Up!
    </h3>
    <p className="mt-2 text-gray-600">
      You have no tasks. Create one to get started.
    </p>
    <button className="mt-6 px-6 py-3 bg-purple-600 text-white rounded-lg">
      Create Task
    </button>
  </div>
);
```

## 🎯 Best Practices

### Sizing

```tsx
// Consistent sizing
const ICON_SIZES = {
  xs: 16,
  sm: 20,
  md: 24,
  lg: 32,
  xl: 48,
};

<MetaMaskIcon size={ICON_SIZES.md} />
```

### Accessibility

```tsx
// Add aria-label for screen readers
<button aria-label="Connect MetaMask wallet">
  <MetaMaskIcon size={24} />
</button>

// Or use title attribute
<MetaMaskIcon size={24} className="cursor-pointer" title="MetaMask" />
```

### Theming

```tsx
// Use CSS custom properties for dynamic colors
<SendIcon
  size={24}
  color="var(--primary-color)"
/>

// Or use Tailwind's currentColor
<div className="text-purple-600">
  <SwapIcon size={24} color="currentColor" />
</div>
```

### Animations

```tsx
// Add transitions and animations
<MetaMaskIcon
  size={48}
  className="transition-transform hover:scale-110 hover:rotate-6"
/>

// Combine with Tailwind animations
<PendingIcon
  size={24}
  className="animate-spin"
  color="#f59e0b"
/>
```

## 🔧 Customization

### Custom Wrapper

```tsx
import IconWrapper, { IconProps } from './components/icons/IconWrapper';

const MyCustomIcon: React.FC<IconProps> = (props) => {
  return (
    <IconWrapper {...props} viewBox="0 0 24 24">
      {/* Your custom SVG paths */}
      <path d="..." fill="currentColor" />
    </IconWrapper>
  );
};
```

### Style Overrides

```tsx
// Override with inline styles
<EthereumIcon
  size={40}
  style={{
    filter: 'drop-shadow(0 4px 8px rgba(98, 126, 234, 0.3))',
    transition: 'all 0.3s ease',
  }}
/>

// Or with className
<EthereumIcon
  size={40}
  className="shadow-xl hover:shadow-2xl transition-shadow"
/>
```

## 📊 Icon Reference

### Complete Icon List

**Wallets (3)**
- MetaMaskIcon
- WalletConnectIcon
- CoinbaseWalletIcon

**Chains (4)**
- EthereumIcon
- PolygonIcon
- ArbitrumIcon
- OptimismIcon

**Actions (4)**
- SendIcon
- ReceiveIcon
- SwapIcon
- StakeIcon

**Status (3)**
- PendingIcon
- ConfirmedIcon
- FailedIcon

**Illustrations (3)**
- EmptyWalletIllustration
- NoTodosIllustration
- BlockchainIllustration

**Total: 17 Components**

## 🚀 Performance

- **Optimized SVGs**: All icons are optimized for performance
- **Tree-shakeable**: Import only what you need
- **No external dependencies**: Pure React components
- **Small bundle size**: < 10KB for entire library

## 🎨 Design System Integration

All icons follow these design principles:
- Consistent stroke width (2-3px)
- Rounded line caps and joins
- Official brand colors
- Scalable vector graphics
- Accessibility-friendly
- Animation-ready

## 📝 License

Icons are designed for use in this project. Wallet and blockchain logos are trademarks of their respective owners.
