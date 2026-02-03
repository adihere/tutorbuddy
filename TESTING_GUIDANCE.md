# 🧪 TutorBuddy Testing Guidance

This document outlines the procedures for running the automated regression tests for TutorBuddy using **Playwright**.

## 📋 Prerequisites

1.  **Node.js**: Ensure Node.js (v18+) is installed.
2.  **Dependencies**: Run `npm install` to install Playwright and other dev dependencies.
3.  **Playwright Browsers**: If this is your first time running Playwright, install the required browsers:
    ```bash
    npx playwright install
    ```

## 🚀 How to Run Tests

**Critical Note:** The tests run against your local development server. You must have the app running in a separate terminal window before executing tests.

### Step 1: Start the Application
Open a terminal and run:
```bash
npm run dev
```
*Ensure the app is running at `http://localhost:5173` (or check `playwright.config.ts` if your port differs).*

### Step 2: Run the Test Suite
Open a **second** terminal and use one of the following commands:

#### 🟢 Standard Run (Headless)
Runs all tests in the background and outputs results to the console. Ideal for CI/CD or quick checks.
```bash
npm test
```

#### 🟡 UI Mode (Interactive)
Opens the Playwright UI dashboard. This allows you to:
*   Watch tests run visually.
*   Time-travel through test steps.
*   Inspect network requests and DOM snapshots.
```bash
npm run test:ui
```

#### 🔴 Debug Mode
Runs tests step-by-step, allowing you to inspect the browser state during execution.
```bash
npm run test:debug
```

---

## 🔎 What is Tested?

The regression suite (`tests/smoke.spec.ts`) covers critical user flows:

1.  **Landing Page**: Verifies navigation and hero section visibility.
2.  **Contextual Vision (OCR)**: Simulates uploading a homework image and verifies the UI enters "Context Loaded" state.
3.  **End-to-End Lesson Generation**:
    *   Fills out the topic form.
    *   Mocks the AI generation process.
    *   Verifies the Result View renders (Headers, Markdown, Diagrams).
    *   Checks for Grounding Citations.
4.  **Session History**: Verifies that lessons persist in `localStorage` and can be reloaded.
5.  **Multi-Modal Features**:
    *   **Audio**: Checks if the "Buddy Dialogue" player appears and interacts.
    *   **Quiz**: Simulates taking a quiz, getting a wrong answer (feedback), and a correct answer.
    *   **Deep Dives**: Tests the generation of micro-lessons via the Deep Dive panel.

## 🤖 API Mocking Strategy

To ensure tests are fast, reliable, and **do not consume your Gemini API quota**, all network requests to Google GenAI are **mocked** inside `smoke.spec.ts`.

*   **Mocking Implementation**: See `page.route('**/models/*generate*', ...)` in the test file.
*   **Behavior**: The test intercepts outgoing requests and returns pre-defined JSON responses (e.g., `MOCK_TUTORIAL`, `MOCK_QUIZ`).
*   **Benefits**:
    *   Tests run in seconds, not minutes.
    *   No flakiness due to AI variability.
    *   No API keys required for testing.

## ⚠️ Troubleshooting

**Error: `Connection refused`**
*   **Cause**: The dev server is not running.
*   **Fix**: Run `npm run dev` in a separate terminal.

**Error: `Timeout exceeded`**
*   **Cause**: The app might be compiling for the first time or your computer is slow.
*   **Fix**: Playwright will automatically retry. If it persists, ensure your machine isn't under heavy load.

**Error: TypeScript / Buffer issues**
*   **Fix**: Ensure `node:buffer` is imported in the test file (this is already handled in the codebase).
