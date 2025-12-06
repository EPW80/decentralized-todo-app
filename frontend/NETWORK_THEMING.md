# Network-Specific Color Theming

A comprehensive theming system that applies unique colors and visual styles based on the connected blockchain network.

## Supported Networks & Colors

| Network | Chain ID | Primary Color | Visual Identity |
|---------|----------|---------------|-----------------|
| **Ethereum Mainnet** | 1 | `#627EEA` | Blue-purple gradient |
| **Sepolia Testnet** | 11155111 | `#FF6B9D` | Pink gradient |
| **Polygon** | 137 | `#8247E5` | Purple gradient |
| **Polygon Mumbai** | 80001 | `#8247E5` | Purple gradient |
| **Arbitrum** | 42161 | `#28A0F0` | Bright blue gradient |
| **Arbitrum Goerli** | 421613 | `#28A0F0` | Bright blue gradient |
| **Optimism** | 10 | `#FF0420` | Red gradient |
| **Optimism Sepolia** | 11155420 | `#FF0420` | Red gradient |
| **Localhost** | 31337 | `#667EEA` | Blue-purple gradient |

## Theme Properties

Each network theme includes:

```typescript
interface NetworkTheme {
  chainId: number;
  name: string;
  primaryColor: string;      // Main brand color
  secondaryColor: string;    // Lighter shade
  accentColor: string;       // Darker shade
  gradient: string;          // CSS gradient string
  glowColor: string;         // RGBA glow effect
  badgeGradient: string;     // Tailwind gradient classes
}
```

## Visual Applications

### 1. Header Background
- Subtle hexagon and grid patterns
- Pattern colors match the connected network
- Located at: `frontend/src/components/Header.tsx:15-17`

### 2. Wallet Connect Button
- **Network Badge**: Prominent gradient button showing current network
- **Animated Shimmer**: Hover effect with network colors
- **Status Indicator**: Pulsing white dot for active connection
- **Network Switcher**: Click to open network selection modal
- **Warning Badge**: Yellow indicator for unsupported networks
- Located at: `frontend/src/components/WalletConnect.tsx:168-225`

### 3. Todo Items
Each todo displays network-specific styling:

#### Visual Indicators:
- **Top Accent Strip**: 1px gradient bar at the top
- **Left Border**: 4px solid border in network color
- **Shadow/Glow**: Box shadow using network glow color
- **Background Patterns**: Hexagons and grid in network colors
- **Blockchain Border**: Animated border for synced items

#### Network Badge:
- Displays the network name where the todo was created
- Gradient background with network colors
- Lightning bolt icon
- Shows even if you're on a different network

#### Cross-Network Warning:
- Yellow "Wrong Network" badge appears when viewing a todo from a different chain
- Helps prevent confusion when switching networks
- Located at: `frontend/src/components/TodoItem.tsx:260-268`

### 4. Network Switcher Modal
Interactive modal for switching between supported networks:

#### Features:
- Grid layout of all supported networks
- Each network card shows:
  - Network icon with gradient background
  - Network name and chain ID
  - Color bar showing theme colors
  - Active indicator (pulsing dot)
  - Hover effects with network colors
- Click any network to switch
- Located at: `frontend/src/components/NetworkSwitcher.tsx`

### 5. Network Badge Component
Reusable component with multiple variants:

#### Variants:
```tsx
// Default - Full card with details
<NetworkBadge variant="default" />

// Compact - Minimal inline badge
<NetworkBadge variant="compact" />

// Pill - Rounded pill style
<NetworkBadge variant="pill" />

// Icon Only - Just the network icon
<NetworkBadge variant="icon-only" />
```

#### Props:
- `variant`: 'default' | 'compact' | 'pill' | 'icon-only'
- `showStatus`: boolean - Show active/inactive status
- `animated`: boolean - Enable glow animation
- `className`: string - Additional CSS classes

Located at: `frontend/src/components/NetworkBadge.tsx`

## Dynamic Theming System

### useNetworkTheme Hook
Automatically provides the correct theme based on connected network:

```tsx
import { useNetworkTheme } from '../hooks/useNetworkTheme';

const MyComponent = () => {
  const networkTheme = useNetworkTheme();

  return (
    <div style={{
      background: networkTheme.gradient,
      boxShadow: `0 4px 16px ${networkTheme.glowColor}`
    }}>
      Connected to {networkTheme.name}
    </div>
  );
};
```

### CSS Custom Properties
Theme colors are automatically set as CSS variables:

```css
:root {
  --color-primary: #627EEA;      /* Updates on network change */
  --color-secondary: #7C95F0;
  --color-accent: #4A67D8;
  --shadow-color: rgba(98, 126, 234, 0.35);
  --gradient-primary: linear-gradient(135deg, #627EEA 0%, #7C95F0 100%);
  --rgb-primary: 98, 126, 234;
  --rgb-secondary: 124, 149, 240;
}
```

## User Experience Benefits

### Visual Clarity
- **Instant Recognition**: Users immediately see which network they're on
- **Color Coding**: Each blockchain has a distinct color identity
- **Consistency**: Same network = same colors across all UI elements

### Cross-Network Awareness
- **Todo Network Badge**: Shows which chain each task belongs to
- **Wrong Network Warning**: Clear indicator when viewing cross-chain items
- **Network Switcher**: Easy switching between supported networks

### Brand Recognition
- **Ethereum**: Classic blue-purple
- **Sepolia**: Pink for testnet visibility
- **Polygon**: Purple brand colors
- **Arbitrum**: Bright blue
- **Optimism**: Bold red

## Implementation Examples

### Basic Usage in Component
```tsx
import { useNetworkTheme } from '../hooks/useNetworkTheme';

const Card = () => {
  const theme = useNetworkTheme();

  return (
    <div
      className="rounded-xl p-4"
      style={{
        borderLeft: `4px solid ${theme.primaryColor}`,
        boxShadow: `0 4px 16px ${theme.glowColor}`
      }}
    >
      <h2 style={{ color: theme.primaryColor }}>
        My Card
      </h2>
    </div>
  );
};
```

### Using Network Badge
```tsx
import NetworkBadge from './NetworkBadge';

// In your component
<NetworkBadge variant="pill" animated />
```

### Network Switcher
```tsx
import NetworkSwitcher from './NetworkSwitcher';

const [showSwitcher, setShowSwitcher] = useState(false);

<button onClick={() => setShowSwitcher(true)}>
  Switch Network
</button>

{showSwitcher && (
  <NetworkSwitcher onClose={() => setShowSwitcher(false)} />
)}
```

### Per-Item Network Theming
```tsx
import { getNetworkTheme } from '../config/networkThemes';

const TodoItem = ({ todo }) => {
  // Get theme for the network this todo was created on
  const todoTheme = getNetworkTheme(todo.chainId);

  return (
    <div style={{
      borderLeft: `4px solid ${todoTheme.primaryColor}`,
      boxShadow: `0 4px 16px ${todoTheme.glowColor}`
    }}>
      {/* Content */}
    </div>
  );
};
```

## Configuration

Network themes are defined in `frontend/src/config/networkThemes.ts`.

### Adding a New Network
```typescript
export const networkThemes: Record<number, NetworkTheme> = {
  // ... existing networks

  // New network
  12345: {
    chainId: 12345,
    name: 'My Network',
    primaryColor: '#FF5733',
    secondaryColor: '#FF7F50',
    accentColor: '#CC4529',
    gradient: 'linear-gradient(135deg, #FF5733 0%, #FF7F50 100%)',
    glowColor: 'rgba(255, 87, 51, 0.35)',
    badgeGradient: 'from-[#FF5733] to-[#FF7F50]',
  },
};
```

## Performance Considerations

1. **CSS Variables**: Theme changes update CSS variables, avoiding re-renders
2. **Memoization**: Theme objects are memoized in the hook
3. **Conditional Rendering**: Network switcher only renders when opened
4. **Lazy Patterns**: Background patterns use low opacity for performance

## Accessibility

- High contrast between text and backgrounds
- Status indicators use both color and icons
- Network names displayed alongside colors
- Respects `prefers-reduced-motion` for animations

## Testing Networks

To test different network themes:

1. Connect your wallet to the app
2. Click the network badge in the header
3. Select a different network from the switcher
4. Observe the color changes throughout the UI
5. Create todos on different networks to see cross-network indicators

## Future Enhancements

Potential improvements:
- [ ] Custom theme editor
- [ ] User-defined network colors
- [ ] Dark mode network themes
- [ ] Network-specific animations
- [ ] Export theme as CSS/JSON
