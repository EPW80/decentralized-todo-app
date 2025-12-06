# Crypto-Native Visual Pattern Components

A collection of blockchain and crypto-themed visual components for enhancing your decentralized application's UI.

## Components

### 1. HexagonPattern
Hexagonal grid pattern representing blockchain network nodes.

```tsx
import { HexagonPattern } from './patterns';

<HexagonPattern
  opacity={0.1}
  size={40}
  color="#667eea"
  className="rounded-xl"
/>
```

**Props:**
- `opacity` (number): Pattern opacity (default: 0.1)
- `size` (number): Size of hexagons (default: 40)
- `color` (string): Hexagon color (default: '#667eea')
- `className` (string): Additional CSS classes

### 2. ChainLinkPattern
Visual representation of blockchain links/connections.

```tsx
import { ChainLinkPattern } from './patterns';

<ChainLinkPattern
  count={5}
  animated={true}
  color="#667eea"
  direction="horizontal"
/>
```

**Props:**
- `count` (number): Number of chain links (default: 5)
- `animated` (boolean): Enable pulse animation (default: false)
- `color` (string): Link color (default: '#667eea')
- `direction` ('horizontal' | 'vertical'): Chain direction (default: 'horizontal')

### 3. NetworkNodes
Animated network of connected nodes simulating blockchain connections.

```tsx
import { NetworkNodes } from './patterns';

<NetworkNodes
  nodeCount={20}
  animated={true}
  color="#667eea"
  connectionOpacity={0.15}
/>
```

**Props:**
- `nodeCount` (number): Number of nodes (default: 20)
- `animated` (boolean): Enable node movement (default: true)
- `color` (string): Node and connection color (default: '#667eea')
- `connectionOpacity` (number): Connection line opacity (default: 0.15)

### 4. DigitalGrid
Matrix-style digital grid overlay with gradient fade.

```tsx
import { DigitalGrid } from './patterns';

<DigitalGrid
  gridSize={30}
  color="#667eea"
  opacity={0.1}
  animated={false}
/>
```

**Props:**
- `gridSize` (number): Grid cell size (default: 30)
- `color` (string): Grid color (default: '#667eea')
- `opacity` (number): Grid opacity (default: 0.1)
- `animated` (boolean): Enable pulse animation (default: false)

### 5. BlockchainBorder
Animated dashed border with corner accents representing blockchain blocks.

```tsx
import { BlockchainBorder } from './patterns';

<BlockchainBorder
  animated={true}
  color="#667eea"
  thickness={2}
/>
```

**Props:**
- `animated` (boolean): Enable border flow animation (default: false)
- `color` (string): Border color (default: '#667eea')
- `thickness` (number): Border thickness (default: 2)

### 6. ChainDivider
Horizontal divider with chain link decoration.

```tsx
import { ChainDivider } from './patterns';

<ChainDivider animated={true} />
```

**Props:**
- `animated` (boolean): Enable chain pulse animation (default: false)
- `className` (string): Additional CSS classes

### 7. BlockchainSpinner
Hexagonal loading spinner with rotating nodes and orbiting blocks.

```tsx
import { BlockchainSpinner } from './patterns';

<BlockchainSpinner
  size="md"
  message="Processing on blockchain..."
  showChainLinks={true}
/>
```

**Props:**
- `size` ('sm' | 'md' | 'lg' | 'xl'): Spinner size (default: 'md')
- `message` (string): Loading message (default: 'Processing on blockchain...')
- `showChainLinks` (boolean): Show orbiting blocks (default: true)

### 8. BlockConfirmation
Success animation with blockchain confirmation effects.

```tsx
import { BlockConfirmation } from './patterns';

<BlockConfirmation
  message="Transaction Confirmed!"
  txHash="0x123..."
  onComplete={() => console.log('Animation done')}
  duration={3000}
/>
```

**Props:**
- `message` (string): Success message (default: 'Transaction Confirmed!')
- `txHash` (string): Optional transaction hash to display
- `onComplete` (function): Callback when animation completes
- `duration` (number): Animation duration in ms (default: 3000)

## Usage Examples

### Loading State
```tsx
{isLoading && (
  <div className="flex justify-center p-12">
    <BlockchainSpinner size="lg" message="Syncing with blockchain..." />
  </div>
)}
```

### Success Confirmation
```tsx
{isSuccess && (
  <BlockConfirmation
    message="Task created successfully!"
    txHash={transactionHash}
    onComplete={() => setIsSuccess(false)}
  />
)}
```

### Card with Background Patterns
```tsx
<div className="glass-effect rounded-xl p-6 relative overflow-hidden">
  <HexagonPattern opacity={0.08} size={30} className="rounded-xl" />
  <DigitalGrid opacity={0.05} gridSize={25} className="rounded-xl" />
  <BlockchainBorder animated={true} thickness={2} />

  <div className="relative z-10">
    {/* Your content here */}
  </div>
</div>
```

### Divider with Chain Links
```tsx
<div className="my-8">
  <ChainDivider animated={true} />
</div>
```

## Available CSS Animations

The following CSS animations are available for crypto effects:

- `animate-border-flow` - Animated dashed border flow
- `animate-node-glow` - Pulsing node glow effect
- `animate-hexagon-pulse` - Hexagon pulse animation
- `animate-block-rotate` - Rotating block animation
- `animate-particle-float` - Floating particle effect
- `animate-chain-pulse` - Chain link pulse
- `animate-glow-pulse` - Glowing pulse effect
- `animate-success-expand` - Success expansion animation

## Tips

1. **Layer patterns**: Use multiple patterns with different opacities for depth
2. **Match network theme**: Use `useNetworkTheme()` hook to get network-specific colors
3. **Positioning**: Always use `relative overflow-hidden` on parent containers
4. **Z-index**: Content should have `relative z-10` to appear above patterns
5. **Performance**: Disable animations in components that aren't visible
6. **Accessibility**: Consider users with motion preferences using the prefers-reduced-motion media query

## Network Theme Integration

All components support dynamic theming based on the connected blockchain network:

```tsx
import { useNetworkTheme } from '../../hooks/useNetworkTheme';

const MyComponent = () => {
  const networkTheme = useNetworkTheme();

  return (
    <HexagonPattern color={networkTheme.primaryColor} />
  );
};
```
