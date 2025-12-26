# 🧠 TutorBuddy: Agentic Mastery Platform

## 🎯 Overview and Purpose

**TutorBuddy** is a world-class, agentic tutoring application designed to empower learners aged 5-17. By leveraging Google's latest Gemini 3 Flash models, it transforms simple queries into a complete **Mastery Canvas**—comprising structured lessons, emotional audio dialogues, and adaptive quizzes.

Think of TutorBuddy as your personal AI tutor that works like a digital Swiss Army knife for education. Just as a Swiss Army knife contains multiple tools for different situations, TutorBuddy provides multiple learning modalities (text, audio, visuals, quizzes) that adapt to each learner's unique needs and preferences.

## ⚙️ Key Concepts and Architecture

### Core Components

1. **Main Application** ([`App.tsx`](App.tsx:1))
   - Central orchestrator managing application state and user flow
   - Handles session initialization, content generation, and error management

2. **User Interface Components**
   - [`LandingPage.tsx`](components/LandingPage.tsx:1): Hero section with key connection and dynamic image generation
   - [`TutorForm.tsx`](components/TutorForm.tsx:1): Input form for topic, subject, age, and output mode selection
   - [`ResultView.tsx`](components/ResultView.tsx:1): Comprehensive display of generated learning content
   - [`Quiz.tsx`](components/Quiz.tsx:1): Interactive quiz component with immediate feedback
   - [`ImageSlideshow.tsx`](components/ImageSlideshow.tsx:1): Auto-rotating gallery of educational visuals
   - [`ParentReportView.tsx`](components/ParentReportView.tsx:1): Guardian insights and recommendations

3. **Service Layer** ([`geminiService.ts`](services/geminiService.ts:1))
   - Handles all AI model interactions
   - Implements safety validation and content generation
   - Manages multi-modal content creation (text, audio, images)

### Application Flow

The TutorBuddy experience follows this logical progression:

1. **Initialization** → User enters topic, selects subject, age, and output mode
2. **Safety Validation** → AI validates topic appropriateness for the age group
3. **Content Generation** → Parallel creation of tutorial, quiz, images, and audio
4. **Presentation** → Display of comprehensive learning canvas
5. **Interaction** → User engages with content through quiz, chat, and downloads
6. **Assessment** → Parent report generated with performance insights

### Architecture Diagram

```
User Input → Safety Check → Content Generation → Display Canvas → Interactive Learning
     ↓              ↓              ↓                ↓                ↓
TutorForm → validateTopic → generateTutorial → ResultView → Quiz/Chat/Download
                     → generateQuiz
                     → generateImages
                     → generateSpeech
                     → generateParentReport
```

## 🛠️ Usage and Examples

### Getting Started

1. **Connect Your API Key**
   - Click "Connect Key" on the landing page
   - Select your Google AI Studio API key
   - The key is securely stored for your session

2. **Create Your Learning Session**
   - Enter a topic (e.g., "Photosynthesis", "Roman Empire", "Algebra Basics")
   - Select the subject area from the dropdown
   - Choose the learner's age (5-17 years)
   - Select your preferred output mode:
     - Text Only: Minimalist lesson
     - Text & Audio: Read + Listen experience
     - Visual Tutor: Full multimedia with images and quiz

3. **Optional: Add Context**
   - Upload an image of classwork or homework
   - AI will align the lesson with your curriculum

### Example Learning Session

#### Input Example:
- **Topic**: "Solar System"
- **Subject**: "Science"
- **Age**: 10
- **Mode**: "Visual Tutor"

#### Expected Output:
1. **Structured Tutorial**: Markdown-formatted lesson with headers, bullet points, and key concepts
2. **5 Educational Images**: Visual representations of planets, orbits, and space phenomena
3. **Interactive Quiz**: 5 multiple-choice questions with explanations
4. **Audio Dialogue**: Conversation between Buddy (tutor) and Sam (student) about the solar system
5. **Fun Facts**: 3-5 interesting facts about space
6. **Parent Report**: Summary of learning with recommendations

### Screenshots and Visual Guide

#### 1. Landing Page
![Landing Page](./screenshots/landing-page.png)
The welcoming interface with key connection and feature highlights.

#### 2. Tutor Form
![Tutor Form](./screenshots/tutor-form.png)
Input form where users specify learning parameters and upload context images.

#### 3. Processing State
![Processing](./screenshots/processing.png)
Visual feedback while AI generates the personalized learning content.

#### 4. Result View - Tutorial
![Tutorial View](./screenshots/tutorial-view.png)
The main lesson display with formatted content and audio controls.

#### 5. Result View - Quiz
![Quiz View](./screenshots/quiz-view.png)
Interactive quiz with immediate feedback and explanations.

#### 6. Result View - Image Gallery
![Image Gallery](./screenshots/image-gallery.png)
Auto-rotating slideshow of educational visuals with download options.

#### 7. Parent Report
![Parent Report](./screenshots/parent-report.png)
Comprehensive insights for guardians with performance metrics and recommendations.

## 🛑 Error Handling and Edge Cases

### Common Error Scenarios

1. **API Key Issues**
   - **Error**: "Failed to create lesson. Please check your API key."
   - **Resolution**: Click "Connect Key" to select or update your API key

2. **Safety Validation Failure**
   - **Error**: "Topic unsuitable for our educational platform."
   - **Resolution**: Choose a different topic appropriate for the selected age group

3. **Content Generation Timeout**
   - **Error**: "I'm having a little trouble connecting right now..."
   - **Resolution**: Wait a moment and try again, or check your internet connection

4. **Audio Playback Issues**
   - **Error**: "Failed to play audio dialogue."
   - **Resolution**: Try toggling the audio button again, or use text-only mode

### Edge Case Handling

- **Empty Topic Input**: Form validation prevents submission without a topic
- **Unsupported Image Formats**: Only accepts common image formats (JPEG, PNG)
- **Large Image Uploads**: Automatically resizes to optimize processing
- **Network Interruption**: Graceful degradation with retry options
- **Browser Compatibility**: Fallbacks for older browsers lacking certain features

## 💡 Implementation Details (Reference)

### Key Function: `generateTutorial()` ([`geminiService.ts:40`](services/geminiService.ts:40))

Creates the core lesson content using Gemini 3 Flash with specialized formatting prompts. The function processes both text and optional image inputs to generate age-appropriate educational content with superior readability through strategic use of Markdown formatting.

### Key Function: `validateTopicSafety()` ([`geminiService.ts:15`](services/geminiService.ts:15))

Implements the first layer of child protection by analyzing topics against safety criteria. Returns structured JSON with boolean safety status and explanatory reasoning for any rejected topics.

### Key Function: `generateSpeech()` ([`geminiService.ts:115`](services/geminiService.ts:115))

Transforms tutorial content into an emotional multi-speaker dialogue using Gemini 2.5 Flash TTS. Creates distinct voices for "Buddy" (tutor) and "Sam" (student) with natural emotional expression and educational pacing.

### Key Function: `handleStartSession()` ([`App.tsx:32`](App.tsx:32))

Orchestrates the entire content generation workflow, from safety validation through parallel content creation to final presentation. Implements progressive loading to display initial content quickly while additional components generate in the background.

## 🚀 Key Features

### 1. Multi-Modal Mastery Canvas
Every session generates a comprehensive learning dashboard:
- **Expert Tutorials**: Structured Markdown lessons generated by **Gemini 3 Flash**, optimized for readability with superior spacing and typography.
- **Visualizer Gallery**: A 5-part educational slideshow powered by **Gemini 2.5 Flash Image**.
- **Buddy & Sam Dialogue**: An emotional multi-speaker audio conversation about the topic, powered by **Gemini 2.5 Flash Native Audio (TTS)**.
- **Adaptive Quiz**: A 5-question mastery check to validate learning immediately.

### 2. Safety-First Architecture
TutorBuddy is built with high guardrails for child safety:
- **AI Pre-Check**: Every user query is analyzed by a safety classifier.
- **Safety Directives**: All generative prompts are hardened with strict neutrality and child-safety system instructions.

### 3. Subject-Specific Context
The platform provides specialized tutoring across academic disciplines:
- **Math**, **Science**, **Latin**, **English**, **Geography**.

## 🛠️ Technology Stack

| Component | Model / Technology | Purpose |
| :--- | :--- | :--- |
| **Reasoning & Text** | `gemini-3-flash-preview` | Tutorial, Quiz, and Report generation |
| **Audio (TTS)** | `gemini-2.5-flash-preview-tts` | Multi-speaker emotional educational dialogues |
| **Image Generation** | `gemini-2.5-flash-image` | 5-part educational visual galleries |
| **Safety Logic** | `gemini-3-flash-preview` | Input validation |
| **Frontend** | React 19 + Tailwind CSS | Responsive, high-performance UI |

## 🔑 Setup & Privacy

TutorBuddy operates on a **BYOK (Bring Your Own Key)** model. API keys are handled securely via the provided studio interface.

---
*Developed by Senior Frontend Engineering Team*