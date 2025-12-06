# Enhanced Glassmorphism & Depth Effects

Comprehensive library of glassmorphism components and utilities for creating beautiful, layered, 3D interfaces with depth.

## 📦 Components

### 1. GlassCard (`./GlassCard.tsx`)

Advanced card component with layered glass effects and 3D transforms.

```tsx
import { GlassCard } from './components/glass';

// Basic glass card
<GlassCard>
  <h3>Basic Card</h3>
  <p>Simple glassmorphism effect</p>
</GlassCard>

// Layered glass card with depth
<GlassCard
  layered={true}
  depth="lg"
  hover3d={true}
  glow={true}
  glowIntensity="intense"
>
  <h3>Advanced Card</h3>
  <p>Multiple glass layers with 3D effects</p>
</GlassCard>
```

**Props:**
- `children` (ReactNode) - Card content
- `className` (string) - Additional CSS classes
- `layered` (boolean) - Enable 3-layer depth effect (default: false)
- `depth` ('sm' | 'md' | 'lg') - Shadow depth (default: 'md')
- `hover3d` (boolean) - Enable 3D transform on hover (default: false)
- `glow` (boolean) - Enable glow effect (default: false)
- `glowIntensity` ('normal' | 'intense' | 'active') - Glow strength (default: 'normal')

**Layered Effect:**
When `layered={true}`, creates 3 stacked glass layers:
- Layer 1: Background layer (translated +2px x/y)
- Layer 2: Middle layer (translated +1px x/y)
- Layer 3: Top layer (content)

**Depth Options:**
- `sm` - Subtle shadow (depth-shadow-sm)
- `md` - Medium shadow (depth-shadow)
- `lg` - Deep shadow (depth-shadow-lg)

**Glow Intensities:**
- `normal` - Standard glow (shadow-glow)
- `intense` - Strong glow (glow-intense)
- `active` - Pulsing active glow (glow-active)

### 2. GlassPanel (`./GlassPanel.tsx`)

Floating panel with heavy blur effects and 3D animations.

```tsx
import { GlassPanel } from './components/glass';

// Frosted panel
<GlassPanel frosted={true}>
  <h3>Frosted Glass</h3>
  <p>Heavy blur effect</p>
</GlassPanel>

// Animated floating panel
<GlassPanel
  frosted={true}
  floating={true}
  animate={true}
>
  <h3>Floating Panel</h3>
  <p>Gentle 3D animation</p>
</GlassPanel>

// Dark frosted panel
<GlassPanel
  frosted={true}
  dark={true}
>
  <h3>Dark Mode</h3>
  <p>Darker glass effect</p>
</GlassPanel>
```

**Props:**
- `children` (ReactNode) - Panel content
- `className` (string) - Additional CSS classes
- `frosted` (boolean) - Heavy blur effect (default: false)
- `floating` (boolean) - Enable 3D hover transforms (default: true)
- `dark` (boolean) - Dark frosted variant (default: false)
- `animate` (boolean) - Continuous float animation (default: false)

**Frosted Effects:**
- Regular: `rgba(255, 255, 255, 0.65)` with 32px blur
- Dark: `rgba(30, 30, 50, 0.65)` with 32px blur

**3D Animations:**
- `floating={true}` - 3D rotation on hover (floating-3d-heavy)
- `animate={true}` - Continuous gentle floating (animate-float-3d)

### 3. GradientBorder (`./GradientBorder.tsx`)

Wrapper component for animated gradient borders.

```tsx
import { GradientBorder } from './components/glass';

// Static gradient border
<GradientBorder variant="static">
  <div className="p-6">
    <h3>Static Border</h3>
  </div>
</GradientBorder>

// Animated gradient border
<GradientBorder
  variant="animated"
  thickness={3}
  rounded="2xl"
>
  <div className="p-6">
    <h3>Animated Border</h3>
  </div>
</GradientBorder>

// Rainbow flowing border
<GradientBorder
  variant="rainbow"
  thickness={2}
  glow={true}
>
  <div className="p-6">
    <h3>Rainbow Border</h3>
  </div>
</GradientBorder>
```

**Props:**
- `children` (ReactNode) - Wrapped content
- `className` (string) - Additional CSS classes
- `variant` ('static' | 'animated' | 'rainbow') - Border animation type (default: 'static')
- `thickness` (number) - Border width in pixels (default: 2)
- `rounded` ('sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full') - Border radius (default: 'xl')
- `glow` (boolean) - Add glow effect to border (default: false)

**Variants:**
- `static` - Fixed gradient (purple to pink)
- `animated` - Rotating gradient animation (3s cycle)
- `rainbow` - Multi-color flowing gradient (4s cycle)

**Border Colors:**
- Static/Animated: `#667eea` → `#764ba2`
- Rainbow: `#667eea` → `#764ba2` → `#f093fb` → `#4facfe` → cycle

### 4. ActiveGlow (`./ActiveGlow.tsx`)

Wrapper for elements that need strong glow effects when active.

```tsx
import { ActiveGlow } from './components/glass';

// Active state glow
<ActiveGlow
  active={isActive}
  intensity="intense"
  color="blue"
>
  <div className="p-4 rounded-xl">
    <h3>Active Element</h3>
  </div>
</ActiveGlow>

// Pulsing glow effect
<ActiveGlow
  active={true}
  intensity="extreme"
  pulse={true}
  color="purple"
>
  <button>Pulsing Button</button>
</ActiveGlow>

// Custom color glow
<ActiveGlow
  active={isConnected}
  color="custom"
  customColor="rgba(34, 197, 94, 0.8)"
  intensity="intense"
>
  <div className="status-indicator">Connected</div>
</ActiveGlow>
```

**Props:**
- `children` (ReactNode) - Glowing element
- `className` (string) - Additional CSS classes
- `active` (boolean) - Show glow (default: false)
- `intensity` ('normal' | 'intense' | 'extreme') - Glow strength (default: 'intense')
- `color` ('purple' | 'blue' | 'custom') - Glow color (default: 'blue')
- `customColor` (string) - Custom RGBA color (for color="custom")
- `pulse` (boolean) - Pulsing animation (default: true)

**Intensity Levels:**
- `normal` - 3 glow layers (20px, 40px, 60px)
- `intense` - 4 glow layers with inset (30px, 60px, 90px + inset)
- `extreme` - 5 glow layers (40px, 80px, 120px, 160px + inset)

**Color Presets:**
- `blue` - `rgba(102, 126, 234, 0.8)`
- `purple` - `rgba(118, 75, 162, 0.8)`
- `custom` - User-defined RGBA value

## 🎨 CSS Utilities

All utilities are available globally via the `index.css` file.

### Glass Effects

```css
/* Basic glass */
.glass-effect
.glass-effect-dark

/* Layered glass (3 levels) */
.glass-layer-1  /* 75% opacity, 10px blur */
.glass-layer-2  /* 85% opacity, 16px blur */
.glass-layer-3  /* 95% opacity, 24px blur */

/* Frosted glass (heavy blur) */
.glass-frosted       /* Light frosted: 65% opacity, 32px blur */
.glass-frosted-dark  /* Dark frosted: 65% opacity, 32px blur */
```

### 3D Transform Effects

```css
/* 3D hover transforms */
.floating-3d         /* Medium 3D rotation on hover */
.floating-3d-heavy   /* Strong 3D rotation on hover */

/* 3D animation */
.animate-float-3d    /* Continuous gentle floating */
```

**Transform Details:**
- `floating-3d:hover` - `translateY(-8px) rotateX(5deg) rotateY(-5deg) scale(1.02)`
- `floating-3d-heavy:hover` - `translateY(-12px) rotateX(8deg) rotateY(-8deg) scale(1.03)`

### Glow Effects

```css
/* Static glows */
.glow-intense         /* Blue glow (3 layers) */
.glow-intense-purple  /* Purple glow (3 layers) */

/* Animated glow */
.glow-active          /* Pulsing blue glow */
```

### Gradient Borders

```css
/* Border utilities */
.border-gradient           /* Static gradient border */
.border-gradient-animated  /* Rotating gradient */
.border-rainbow            /* Multi-color flowing border */
```

**Usage:**
These classes work with transparent borders:
```html
<div class="border-rainbow p-6 rounded-xl" style="border-width: 2px">
  Content
</div>
```

### Depth Shadows

```css
/* Layered shadows for depth */
.depth-shadow-sm  /* Subtle 3-layer shadow */
.depth-shadow     /* Medium 3-layer shadow */
.depth-shadow-lg  /* Deep 3-layer shadow */
```

**Shadow Layers:**
Each depth shadow has 3 stacked layers with decreasing opacity for realistic depth perception.

## 💡 Usage Examples

### Layered Card Dashboard

```tsx
import { GlassCard, GradientBorder } from './components/glass';

const Dashboard = () => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
    <GlassCard
      layered={true}
      depth="lg"
      hover3d={true}
      glow={true}
      glowIntensity="normal"
    >
      <h3 className="text-xl font-bold mb-4">Total Tasks</h3>
      <p className="text-4xl font-bold">42</p>
    </GlassCard>

    <GradientBorder variant="rainbow" thickness={2}>
      <GlassCard depth="md" className="h-full">
        <h3 className="text-xl font-bold mb-4">Completed</h3>
        <p className="text-4xl font-bold text-green-600">28</p>
      </GlassCard>
    </GradientBorder>

    <GlassCard
      layered={true}
      depth="lg"
      hover3d={true}
    >
      <h3 className="text-xl font-bold mb-4">Pending</h3>
      <p className="text-4xl font-bold text-orange-600">14</p>
    </GlassCard>
  </div>
);
```

### Frosted Navigation Header

```tsx
import { GlassPanel } from './components/glass';
import { useState, useEffect } from 'react';

const Header = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`
        sticky top-0 z-50 transition-all duration-300
        ${scrolled ? 'glass-frosted backdrop-blur-3xl' : 'glass-effect'}
      `}
    >
      <nav className="container mx-auto px-4 py-3">
        {/* Navigation content */}
      </nav>
    </header>
  );
};
```

### Active Connection Status

```tsx
import { ActiveGlow } from './components/glass';

const ConnectionStatus = ({ isConnected, networkColor }) => (
  <ActiveGlow
    active={isConnected}
    intensity="intense"
    color="custom"
    customColor={networkColor}
    pulse={true}
  >
    <div className="glass-effect px-4 py-2 rounded-xl">
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`} />
        <span className="font-medium">
          {isConnected ? 'Connected' : 'Disconnected'}
        </span>
      </div>
    </div>
  </ActiveGlow>
);
```

### Floating Feature Cards

```tsx
import { GlassPanel, GradientBorder } from './components/glass';

const Features = () => {
  const features = [
    { title: 'Decentralized', icon: '🔗', color: '#667eea' },
    { title: 'Secure', icon: '🔒', color: '#764ba2' },
    { title: 'Fast', icon: '⚡', color: '#f093fb' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {features.map((feature, i) => (
        <GradientBorder
          key={i}
          variant="animated"
          thickness={2}
          rounded="2xl"
          glow={true}
        >
          <GlassPanel
            frosted={true}
            floating={true}
            animate={true}
          >
            <div className="text-center p-8">
              <div className="text-6xl mb-4">{feature.icon}</div>
              <h3 className="text-2xl font-bold">{feature.title}</h3>
            </div>
          </GlassPanel>
        </GradientBorder>
      ))}
    </div>
  );
};
```

### Task Item with 3D Effects

```tsx
import { GlassCard, ActiveGlow } from './components/glass';

const TaskItem = ({ task, isActive, isCompleted }) => (
  <GlassCard
    hover3d={true}
    depth="md"
    glow={isActive}
    glowIntensity={isActive ? 'intense' : 'normal'}
    className={isCompleted ? 'opacity-60' : ''}
  >
    <div className="flex items-center gap-4">
      <input
        type="checkbox"
        checked={isCompleted}
        className="w-6 h-6 rounded-lg"
      />
      <div className="flex-1">
        <p className={`text-lg ${isCompleted ? 'line-through' : ''}`}>
          {task.description}
        </p>
      </div>
      {isActive && (
        <ActiveGlow active={true} intensity="normal" pulse={true}>
          <div className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium">
            In Progress
          </div>
        </ActiveGlow>
      )}
    </div>
  </GlassCard>
);
```

## 🎯 Best Practices

### Performance

```tsx
// ✅ Good - Conditional layering
<GlassCard
  layered={isImportant}
  hover3d={!isMobile}
>
  {content}
</GlassCard>

// ❌ Avoid - Too many layered cards
<div>
  {items.map(item => (
    <GlassCard layered={true} hover3d={true}> {/* Heavy on performance */}
      {item}
    </GlassCard>
  ))}
</div>
```

### Accessibility

```tsx
// Add ARIA labels and semantic HTML
<GlassCard className="focus-visible:ring-4 focus-visible:ring-purple-500">
  <button aria-label="Create new task">
    Create Task
  </button>
</GlassCard>
```

### Reduced Motion

All animations respect `prefers-reduced-motion`:

```css
@media (prefers-reduced-motion: reduce) {
  .floating-3d,
  .animate-float-3d,
  .glow-active {
    animation: none !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Combining Effects

```tsx
// Stack effects for maximum impact
<GradientBorder variant="rainbow" thickness={3} glow={true}>
  <ActiveGlow active={isActive} intensity="extreme">
    <GlassCard layered={true} hover3d={true} depth="lg">
      <h2>Featured Content</h2>
      <p>Multiple layers of glass, rainbow border, and glow</p>
    </GlassCard>
  </ActiveGlow>
</GradientBorder>
```

## 🔧 Customization

### Custom Glass Layers

Create your own glass layers:

```css
.glass-layer-custom {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(20px) saturate(170%);
  border: 1px solid rgba(255, 255, 255, 0.32);
}
```

### Custom Glow Colors

Use network-specific or brand colors:

```tsx
<ActiveGlow
  active={true}
  color="custom"
  customColor="rgba(34, 197, 94, 0.8)"  // Green
  intensity="intense"
>
  {content}
</ActiveGlow>
```

### Custom 3D Transforms

Override the default transforms:

```tsx
<GlassCard
  hover3d={true}
  className="hover:rotate-y-12"  // Custom rotation
  style={{
    transformStyle: 'preserve-3d',
    perspective: '1000px',
  }}
>
  {content}
</GlassCard>
```

## 📊 Component Reference

**Total Components: 4**
- GlassCard
- GlassPanel
- GradientBorder
- ActiveGlow

**CSS Utilities: 15+**
- 5 Glass effect classes
- 2 3D transform classes
- 3 Glow effect classes
- 3 Gradient border classes
- 3 Depth shadow classes

## 🚀 Animation Reference

### Available Animations

```css
@keyframes gradient-rotate      /* 3s - Border gradient rotation */
@keyframes rainbow-flow         /* 4s - Multi-color border flow */
@keyframes glow-pulse-intense   /* 2s - Intense glow pulsing */
@keyframes float-3d             /* 4s - Gentle 3D floating */
```

### Animation Classes

```css
.animate-gradient-rotate        /* Apply gradient rotation */
.animate-rainbow-flow           /* Apply rainbow flow */
.animate-glow-pulse-intense     /* Apply intense glow pulse */
.animate-float-3d               /* Apply 3D floating */
```

## 🎨 Design Principles

1. **Layered Depth**: Multiple semi-transparent layers create realistic depth
2. **Smooth Transitions**: All effects use cubic-bezier easing for natural motion
3. **Subtle Animations**: Gentle movements that enhance without distracting
4. **Responsive Glows**: Glow effects adapt to content state and importance
5. **Accessible**: All effects respect user motion preferences

## 📝 Notes

- All glass effects use `backdrop-filter` which requires browser support
- 3D transforms work best on GPU-accelerated devices
- Layered cards add rendering complexity - use sparingly
- Glow effects are more visible on dark backgrounds
- Rainbow borders create the most striking visual impact

## 🔗 Integration

These components integrate seamlessly with:
- Network theming system (hooks/useNetworkTheme)
- Web3 context for connection states
- Existing pattern components (HexagonPattern, DigitalGrid, etc.)
- Transaction visualization components
- Icon library components
