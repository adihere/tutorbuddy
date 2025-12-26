# TutorBuddy API Documentation

## 🎯 Overview and Purpose

The TutorBuddy service layer ([`geminiService.ts`](services/geminiService.ts:1)) provides a comprehensive interface to Google's Gemini AI models for generating educational content. This module handles all AI interactions, from safety validation to multi-modal content creation, ensuring a seamless and secure learning experience.

Think of this service as the educational content factory that transforms simple user queries into rich, multi-modal learning experiences tailored to each student's needs.

## ⚙️ Key Concepts and Architecture

### Core Functions

1. **Safety Validation** - Ensures all topics are age-appropriate and educational
2. **Content Generation** - Creates tutorials, quizzes, images, and audio content
3. **Multi-Modal Support** - Handles text, image, and audio generation
4. **Error Handling** - Provides graceful fallbacks for API failures

### Architecture Flow

```
User Input → Safety Check → Content Generation → Response Processing → Return to UI
     ↓              ↓              ↓                ↓              ↓
validateTopic → generateTutorial → Format Response → Error Handling → Component Render
              → generateQuiz      → generateImages
              → generateFunFacts  → generateSpeech
              → generateParentReport
```

## 🛠️ API Functions

### `validateTopicSafety(topic, subject, ageGroup)`

Validates whether a topic is appropriate for the specified age group and subject.

**Parameters:**
- `topic` (string): The learning topic to validate
- `subject` (string): Academic subject area
- `ageGroup` (number): Target age (5-17)

**Returns:**
```typescript
Promise<{
  isSafe: boolean;
  reason?: string;
}>
```

**Example:**
```typescript
const result = await validateTopicSafety("Solar System", "Science", 10);
if (result.isSafe) {
  // Proceed with content generation
} else {
  // Show error with result.reason
}
```

**Implementation Details:**
Uses Gemini 3 Flash with structured JSON output to evaluate topic safety against educational standards and age appropriateness.

---

### `generateTutorial(topic, subject, ageGroup, contextImage?)`

Creates a structured, age-appropriate tutorial on the specified topic.

**Parameters:**
- `topic` (string): The learning topic
- `subject` (string): Academic subject area
- `ageGroup` (number): Target age (5-17)
- `contextImage` (string, optional): Base64 image of classwork for curriculum alignment

**Returns:**
- `Promise<string>`: Markdown-formatted tutorial content

**Example:**
```typescript
const tutorial = await generateTutorial(
  "Photosynthesis", 
  "Science", 
  10, 
  "data:image/jpeg;base64,..."
);
// Returns formatted Markdown with headers, bullet points, and key concepts
```

**Implementation Details:**
- Uses specialized formatting prompts for superior readability
- Incorporates context image when provided to align with specific curriculum
- Applies safety directives to ensure age-appropriate content

---

### `generateQuiz(topic, subject, ageGroup, contextImage?)`

Creates an interactive quiz with multiple-choice questions and explanations.

**Parameters:**
- `topic` (string): The quiz topic
- `subject` (string): Academic subject area
- `ageGroup` (number): Target age (5-17)
- `contextImage` (string, optional): Base64 image for question personalization

**Returns:**
```typescript
Promise<QuizQuestion[]>
```

**QuizQuestion Interface:**
```typescript
interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}
```

**Example:**
```typescript
const questions = await generateQuiz("Solar System", "Science", 10);
// Returns array of 5 questions with 4 options each
```

**Implementation Details:**
- Generates exactly 5 questions per topic
- Includes detailed explanations for each correct answer
- Personalizes questions based on provided classwork images

---

### `generateImages(topic, subject, ageGroup)`

Creates a set of educational images to visualize the learning topic.

**Parameters:**
- `topic` (string): Topic to visualize
- `subject` (string): Academic subject area
- `ageGroup` (number): Target age (5-17)

**Returns:**
- `Promise<string[]>`: Array of base64-encoded images

**Example:**
```typescript
const images = await generateImages("Solar System", "Science", 10);
// Returns 5 educational images as base64 data URLs
```

**Implementation Details:**
- Generates exactly 5 different image types:
  1. Educational illustration
  2. Conceptual 3D visualization
  3. Scientific/historical diagram
  4. Atmospheric cinematic scene
  5. Infographic-style summary
- Uses 16:9 aspect ratio for consistency

---

### `generateSpeech(tutorialText, topic, ageGroup)`

Creates an emotional multi-speaker audio dialogue from tutorial content.

**Parameters:**
- `tutorialText` (string): The tutorial content to convert to speech
- `topic` (string): Topic of the tutorial
- `ageGroup` (number): Target age (5-17)

**Returns:**
- `Promise<string | null>`: Base64-encoded audio data or null if failed

**Example:**
```typescript
const audioData = await generateSpeech(tutorialContent, "Solar System", 10);
// Returns base64 audio data for playback
```

**Implementation Details:**
- First transforms tutorial into dialogue between "Buddy" (tutor) and "Sam" (student)
- Uses Gemini 2.5 Flash TTS with multi-speaker configuration
- Applies distinct voices: "Kore" for Buddy, "Puck" for Sam
- Includes emotional expression and educational pacing

---

### `generateFunFacts(topic, subject, ageGroup)`

Creates interesting, age-appropriate facts about the learning topic.

**Parameters:**
- `topic` (string): Topic for fun facts
- `subject` (string): Academic subject area
- `ageGroup` (number): Target age (5-17)

**Returns:**
- `Promise<string[]>`: Array of fun facts (3-5 items)

**Example:**
```typescript
const facts = await generateFunFacts("Solar System", "Science", 10);
// Returns ["Jupiter has 79 known moons.", "A day on Venus is longer than its year.", ...]
```

**Implementation Details:**
- Generates 3-5 facts per topic
- Each fact is under 20 words for easy comprehension
- Focuses on surprising or memorable information

---

### `generateParentReport(topic, subject, ageGroup)`

Creates a comprehensive report for parents/guardians about the learning session.

**Parameters:**
- `topic` (string): Learning topic
- `subject` (string): Academic subject area
- `ageGroup` (number): Target age (5-17)

**Returns:**
```typescript
Promise<ParentReport | null>
```

**ParentReport Interface:**
```typescript
interface ParentReport {
  summary: string;
  highlights: string[];
  recommendations: string;
}
```

**Example:**
```typescript
const report = await generateParentReport("Solar System", "Science", 10);
// Returns structured report with educational insights
```

**Implementation Details:**
- Provides educational value summary
- Includes 3 key learning highlights
- Offers actionable recommendations for home support

---

### `askBuddy(history, userMessage, topic, subject, ageGroup)`

Provides Socratic tutoring assistance through conversational AI.

**Parameters:**
- `history` (array): Previous conversation messages
- `userMessage` (string): Current user question
- `topic` (string): Current learning topic
- `subject` (string): Academic subject area
- `ageGroup` (number): Target age (5-17)

**Returns:**
- `Promise<string>`: Buddy's response

**Example:**
```typescript
const response = await askBuddy(
  [{role: 'user', text: 'What is a planet?'}],
  'How big is the Sun?',
  'Solar System',
  'Science',
  10
);
// Returns encouraging, educational response
```

**Implementation Details:**
- Maintains conversation context through history
- Uses Socratic method to guide learning
- Provides age-appropriate, encouraging responses

## 🛑 Error Handling

### Common Error Scenarios

1. **API Key Issues**
   - **Error**: Authentication failures
   - **Handling**: Returns default values or null responses
   - **User Message**: "Failed to create lesson. Please check your API key."

2. **Content Generation Failures**
   - **Error**: Model timeouts or rate limits
   - **Handling**: Graceful fallbacks with empty arrays or default content
   - **User Message**: "I'm having a little trouble connecting right now..."

3. **Image Generation Errors**
   - **Error**: Content policy violations or technical failures
   - **Handling**: Returns empty array, UI shows placeholder
   - **Recovery**: User can retry without losing other content

### Safety Mechanisms

- **Input Validation**: All user inputs are validated before API calls
- **Content Filtering**: Safety directives applied to all generative prompts
- **Age Appropriateness**: Content tailored to specific age groups
- **Fallback Responses**: Default values when API calls fail

## 💡 Implementation Details

### Safety Directives

All API calls include safety directives:
```
CRITICAL SAFETY & NEUTRALITY DIRECTIVE:
- You are a neutral, objective, and safe educational assistant.
- Do not express opinions on controversial social or political issues.
- Use strictly age-appropriate language.
- Stick to scientific consensus and balanced historical views.
- Absolutely no harmful or adult themes.
```

### Model Selection

| Function | Model | Purpose |
|----------|-------|---------|
| validateTopicSafety | gemini-3-flash-preview | Content safety validation |
| generateTutorial | gemini-3-flash-preview | Text generation |
| generateQuiz | gemini-3-flash-preview | Quiz creation |
| generateFunFacts | gemini-3-flash-preview | Fact generation |
| generateParentReport | gemini-3-flash-preview | Report creation |
| askBuddy | gemini-3-flash-preview | Conversational AI |
| generateSpeech | gemini-2.5-flash-preview-tts | Audio generation |
| generateImages | gemini-2.5-flash-image | Image generation |

### Response Schemas

All functions use structured response schemas for type safety:
- JSON responses with defined interfaces
- Proper error handling with fallbacks
- Consistent return types across functions

---

*This API documentation covers the complete service layer functionality for TutorBuddy's educational content generation system.*