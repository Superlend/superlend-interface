# Superlend Onboarding System

A beautiful, interactive multi-step onboarding dialog for first-time users on Superlend. Features path selection, guided tours, and smooth animations built with React, TypeScript, and Framer Motion.

## ✨ Features

- **Multi-step wizard** with smooth animations
- **Three guided paths**: Earn, Borrow, Learn DeFi
- **Interactive elements** with clickable navigation
- **First-time user detection** using localStorage
- **Professional design** matching your theme
- **Responsive** and mobile-friendly
- **Accessible** with proper ARIA labels
- **Type-safe** with full TypeScript support

## 🚀 Quick Start

### 1. Add to Your App Layout

```tsx
// app/layout.tsx or pages/_app.tsx
import { OnboardingProvider } from '@/components/providers/OnboardingProvider'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <OnboardingProvider>
          {children}
        </OnboardingProvider>
      </body>
    </html>
  )
}
```

### 2. Manual Trigger (Optional)

```tsx
// Any component where you want to trigger onboarding
import { useOnboarding } from '@/hooks/useOnboarding'

function YourComponent() {
  const { openOnboarding, resetOnboarding } = useOnboarding()

  return (
    <div>
      <button onClick={openOnboarding}>
        Start Tour
      </button>
      <button onClick={resetOnboarding}>
        Reset Onboarding
      </button>
    </div>
  )
}
```

## 📁 File Structure

```
components/
├── onboarding/
│   ├── OnboardingDialog.tsx          # Main dialog container
│   ├── steps/
│   │   ├── WelcomeStep.tsx          # Welcome screen
│   │   ├── ChoosePathStep.tsx       # Path selection
│   │   ├── EarnFlowStep.tsx         # Earn introduction
│   │   ├── EarnAssetsStep.tsx       # Earn assets overview
│   │   ├── EarnRiskStep.tsx         # Risk management
│   │   ├── BorrowFlowStep.tsx       # Borrow introduction
│   │   ├── BorrowAssetsStep.tsx     # Borrowable assets
│   │   ├── BorrowCollateralStep.tsx # Collateral info
│   │   ├── LearnFlowStep.tsx        # DeFi learning
│   │   ├── LearnQuizStep.tsx        # Knowledge quiz
│   │   └── FinalStep.tsx            # Completion screen
│   └── index.tsx                    # Exports
├── providers/
│   └── OnboardingProvider.tsx       # App provider
hooks/
└── useOnboarding.ts                 # State management hook
```

## 🎛️ Hook API

The `useOnboarding` hook provides complete control over the onboarding flow:

```tsx
const {
  // State
  isOpen,              // boolean - Dialog visibility
  currentStep,         // OnboardingStep - Current step
  selectedPath,        // OnboardingPath - User's chosen path
  hasSeenOnboarding,   // boolean - Has user completed onboarding
  
  // Navigation
  nextStep,            // () => void - Go to next step
  previousStep,        // () => void - Go to previous step
  canGoBack,           // boolean - Can navigate back
  canGoNext,           // boolean - Can navigate forward
  
  // Actions
  openOnboarding,      // () => void - Open dialog
  closeOnboarding,     // () => void - Close and mark complete
  setStep,             // (step) => void - Jump to specific step
  setPath,             // (path) => void - Set user path
  resetOnboarding,     // () => void - Reset to beginning
  
  // Utils
  getStepProgress,     // () => Progress info
} = useOnboarding()
```

## 🎨 Customization

### Theme Integration

The onboarding system uses your existing Tailwind theme:

- `primary-gradientStart` / `primary-gradientEnd` - Primary gradients
- `accent-lightBlue` / `accent-darkBlue` - Earn path colors
- `accent-lightGreen` / `accent-darkGreen` - Borrow path colors  
- `accent-cream` - Learn path colors
- `foreground` / `background` - Text and background colors
- `gray-*` scale - Neutral colors

### Content Customization

Update content in step components:

```tsx
// components/onboarding/steps/WelcomeStep.tsx
const features = [
  {
    title: "Your Custom Feature",
    description: "Your custom description",
    // ... customize as needed
  }
]
```

### Flow Customization

Modify the step flow in `useOnboarding.ts`:

```tsx
const stepFlow: Record<OnboardingStep, OnboardingStep | null> = {
  'welcome': 'choose-path',
  // ... add your custom flow
}
```

## 🔧 Advanced Configuration

### Custom Storage

Replace localStorage with your preferred storage:

```tsx
// hooks/useOnboarding.ts
const STORAGE_KEY = 'your_custom_key'

// Replace localStorage calls with your storage solution
const hasCompleted = await yourStorage.get(STORAGE_KEY)
yourStorage.set(STORAGE_KEY, 'true')
```

### Backend Integration

Sync onboarding status with your backend:

```tsx
useEffect(() => {
  // On completion
  if (hasSeenOnboarding) {
    fetch('/api/user/onboarding-complete', {
      method: 'POST',
      body: JSON.stringify({ completed: true, path: selectedPath })
    })
  }
}, [hasSeenOnboarding, selectedPath])
```

### Analytics Integration

Track onboarding progress:

```tsx
// In step components
useEffect(() => {
  analytics.track('Onboarding Step Viewed', {
    step: currentStep,
    path: selectedPath,
    progress: getStepProgress().percentage
  })
}, [currentStep])
```

## 🎭 Animation Customization

Modify animations in step components:

```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ 
    duration: 0.5,        // Animation duration
    delay: 0.2,           // Delay before start
    ease: "easeInOut"     // Easing function
  }}
>
  {/* Your content */}
</motion.div>
```

## 📱 Mobile Considerations

The onboarding is fully responsive, but for mobile optimization:

- Large dialog (85vh height) provides good mobile experience
- Touch-friendly button sizes (min 44px)
- Readable text sizes (16px minimum)
- Proper spacing for thumb navigation

## 🧪 Testing

Test the onboarding flow:

```tsx
// Test helper
function TestOnboarding() {
  const { resetOnboarding, setStep } = useOnboarding()
  
  return (
    <div className="fixed bottom-4 right-4 space-x-2">
      <button onClick={resetOnboarding}>Reset</button>
      <button onClick={() => setStep('choose-path')}>Jump to Path</button>
    </div>
  )
}
```

## 🔒 User Privacy

The onboarding system:
- Only stores completion status locally
- No personal data collection
- Respects user's "skip" choice
- Can be reset at any time

## 🚧 Troubleshooting

### Dialog Not Showing
- Check if `OnboardingProvider` is properly wrapped around your app
- Verify localStorage isn't disabled
- Check console for any import errors

### Styling Issues
- Ensure Tailwind CSS is properly configured
- Check that all custom CSS variables are defined
- Verify Framer Motion is installed

### Navigation Issues
- Check step flow logic in `useOnboarding.ts`
- Verify all step components are properly exported
- Test `canGoNext` and `canGoBack` logic

## 📋 Browser Support

- Chrome 88+
- Firefox 85+
- Safari 14+
- Edge 88+

Requires support for:
- ES2020 features
- CSS Custom Properties
- Local Storage

---

**Need help?** Check the implementation files or create an issue with specific questions about integration or customization. 