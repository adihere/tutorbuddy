# TutorBuddy UI Components Documentation

## 🎯 Overview and Purpose

The TutorBuddy UI components ([`components/`](components/)) provide a comprehensive, accessible interface for AI-powered educational content. Each component is designed with a specific focus, from user onboarding to interactive learning experiences.

Think of these components as specialized rooms in a digital school - each with its own purpose, but all working together to create a complete learning environment.

## ⚙️ Key Concepts and Architecture

### Component Hierarchy

```
App.tsx (Main Application)
├── Layout.tsx (Page Structure)
├── LandingPage.tsx (Welcome Interface)
├── TutorForm.tsx (Input Form)
└── ResultView.tsx (Content Display)
    ├── ImageSlideshow.tsx (Visual Gallery)
    ├── Quiz.tsx (Interactive Assessment)
    └── ParentReportView.tsx (Guardian Insights)

Note: ContentDisplay.tsx exists but is currently empty (placeholder for future use)
```

### Design Principles

- **Accessibility**: WCAG 2.1 AA compliance with semantic HTML
- **Responsive**: Mobile-first design with progressive enhancement
- **Interactive**: Smooth animations and micro-interactions
- **Consistent**: Unified design system with Tailwind CSS

## 🛠️ Component Documentation

### `App.tsx` - Main Application Component

**Purpose**: Central orchestrator managing application state and user flow

**Key Features**:
- State management for learning sessions
- Error handling and user feedback
- API key management
- Content generation orchestration

**State Management**:
```typescript
type AppState = 'IDLE' | 'PROCESSING' | 'RESULT' | 'ERROR';

const [state, setState] = useState<AppState>('IDLE');
const [content, setContent] = useState<LearningContent | null>(null);
const [error, setError] = useState<string | null>(null);
```

**Key Functions**:
- `handleStartSession()`: Initiates content generation workflow
- `resetSession()`: Clears state for new learning session
- `downloadTutorial()`: Exports tutorial as Markdown file

---

### `Layout.tsx` - Page Structure Wrapper

**Purpose**: Provides consistent page layout with navigation and footer

**Features**:
- Sticky header with navigation
- Safety warning banner
- Responsive container
- Footer with attribution

**Usage**:
```typescript
<Layout>
  <YourComponent />
</Layout>
```

**Structure**:
- Header with logo and version badge
- Safety banner for parental supervision
- Main content area
- Footer with attribution

---

### `LandingPage.tsx` - Welcome Interface

**Purpose**: Engaging entry point with feature highlights and API key connection

**Features**:
- Hero section with dynamic image generation
- Feature grid with hover effects
- API key connection status
- Call-to-action buttons

**Key Functions**:
- `checkKeyStatus()`: Verifies API key availability
- `generateHeroImage()`: Creates dynamic hero image
- `handleConnectKey()`: Opens API key selection dialog

**Props**:
```typescript
interface LandingPageProps {
  onStart: () => void;
}
```

**Interactive Elements**:
- Animated status indicators
- Hover effects on feature cards
- Dynamic image generation
- Smooth scroll to form

---

### `TutorForm.tsx` - Learning Session Input

**Purpose**: Collects user preferences for personalized learning content

**Features**:
- Topic input with validation
- Subject and age selection
- Output mode options
- Context image upload

**Props**:
```typescript
interface TutorFormProps {
  onSubmit: (topic: string, subject: string, ageGroup: number, outputMode: OutputMode, contextImage?: string) => void;
  isLoading: boolean;
}
```

**Form Elements**:
- **Topic Input**: Text field with placeholder and validation
- **Subject Dropdown**: Predefined academic subjects
- **Age Selector**: Range 5-17 years
- **Output Modes**: Visual cards for different learning experiences
- **Image Upload**: Optional classwork/homework image

**Output Modes**:
1. **Text Only**: Minimalist lesson experience
2. **Text & Audio**: Read + Listen functionality
3. **Visual Tutor**: Full multimedia with images and quiz
4. **Multi-Modal**: Coming soon (disabled)

**Validation**:
- Required topic field
- File type and size validation
- Form submission prevention during loading

---

### `ResultView.tsx` - Comprehensive Content Display

**Purpose**: Presents generated learning content in an organized, interactive interface

**Features**:
- Tabbed content display (Preview/Raw Markdown)
- Audio playback controls
- Interactive chat with Buddy
- Download functionality
- Responsive layout

**Props**:
```typescript
interface ResultViewProps {
  content: LearningContent;
  onReset: () => void;
  onDownloadTutorial: () => void;
}
```

**Layout Structure**:
- **Header**: Topic title and action buttons
- **Main Content** (2/3 width):
  - Tutorial display with preview/raw modes
  - Socratic chat interface
- **Sidebar** (1/3 width):
  - Image slideshow
  - Fun facts section
  - Interactive quiz
- **Footer**: Parent report section

**Key Functions**:
- `handleToggleAudio()`: Plays/pauses multi-speaker dialogue
- `handleSendMessage()`: Sends messages to Buddy
- `handleDownloadFullPack()`: Creates ZIP with all content

**Audio Implementation**:
- WAV file creation from PCM data
- Web Audio API for playback
- Multi-speaker voice configuration

---

### `Quiz.tsx` - Interactive Assessment

**Purpose**: Provides engaging quiz experience with immediate feedback

**Features**:
- Progress tracking
- Visual feedback for answers
- Explanations for each question
- Score calculation and display

**Props**:
```typescript
interface QuizProps {
  questions: QuizQuestion[];
  onComplete: (result: QuizResult) => void;
}
```

**Quiz Flow**:
1. **Question Display**: Shows current question with options
2. **Answer Selection**: Visual feedback for user choice
3. **Verification**: Reveals correct answer with explanation
4. **Progression**: Advances to next question or completes quiz
5. **Results**: Displays final score with performance message

**Interactive Elements**:
- Animated progress bar
- Hover states on options
- Success/error animations
- Shake effect for wrong answers

**Scoring System**:
- 80%+ : Excellent mastery (🏆)
- 50-79% : Good progress (🥈)
- <50% : Needs more practice (📚)

---

### `ImageSlideshow.tsx` - Visual Gallery

**Purpose**: Displays educational images in an auto-rotating slideshow

**Features**:
- Automatic rotation (4.5 second intervals)
- Manual navigation controls
- Individual image download
- Responsive display

**Props**:
```typescript
interface ImageSlideshowProps {
  images: string[];
  topic?: string;
}
```

**Functionality**:
- **Auto-rotation**: Cycles through images automatically
- **Dot Navigation**: Direct access to specific images
- **Download Button**: Save current image locally
- **Lazy Loading**: Optimizes performance

**Accessibility**:
- ARIA labels for screen readers
- Keyboard navigation support
- Focus management

---

### `ParentReportView.tsx` - Guardian Insights

**Purpose**: Presents educational insights and recommendations for parents/guardians

**Features**:
- Session summary
- Learning highlights
- Performance metrics
- Actionable recommendations

**Props**:
```typescript
interface ParentReportViewProps {
  report: ParentReport;
  quizResult?: QuizResult | null;
}
```

**Report Sections**:
1. **Header**: Title and performance metrics
2. **Session Summary**: Educational value overview
3. **Learning Highlights**: Key focus areas
4. **Recommendations**: Home support strategies

**Visual Design**:
- Dark theme for contrast
- Icon-based section indicators
- Progress visualization
- Professional layout

---

## 🛑 Error Handling and Edge Cases

### Common Error Scenarios

1. **Missing Content**
   - **Handling**: Loading states with shimmer effects
   - **Fallback**: Placeholder content or empty states
   - **User Feedback**: Clear loading indicators

2. **Audio Playback Failures**
   - **Handling**: Error messages and retry options
   - **Fallback**: Text-only mode availability
   - **User Feedback**: Clear error messaging

3. **Image Loading Errors**
   - **Handling**: Broken image placeholders
   - **Fallback**: Retry mechanisms
   - **User Feedback**: Loading states

### Edge Case Handling

- **Empty States**: Graceful handling of missing data
- **Network Issues**: Offline indicators and retry options
- **Browser Compatibility**: Feature detection and fallbacks
- **Accessibility**: Screen reader support and keyboard navigation

## 💡 Implementation Details

### State Management Patterns

Components use React hooks for state management:
- `useState` for local component state
- `useCallback` for memoized functions
- `useEffect` for side effects and lifecycle
- `useRef` for DOM references

### Styling Approach

- **Tailwind CSS**: Utility-first styling
- **Responsive Design**: Mobile-first breakpoints
- **Animations**: CSS transitions and transforms
- **Dark Mode**: Consistent color schemes

### Performance Optimizations

- **Code Splitting**: Lazy loading of components
- **Image Optimization**: WebP format and lazy loading
- **Memoization**: Preventing unnecessary re-renders
- **Bundle Size**: Tree shaking and minification

### Accessibility Features

- **Semantic HTML**: Proper element usage
- **ARIA Labels**: Screen reader support
- **Keyboard Navigation**: Full keyboard access
- **Focus Management**: Logical focus flow
- **Color Contrast**: WCAG AA compliance

---

*This component documentation covers the complete UI architecture for TutorBuddy's educational interface.*