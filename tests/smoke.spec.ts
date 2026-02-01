import { test, expect } from '@playwright/test';

// Mock Data Helpers
const MOCK_IMAGE_B64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

const MOCK_TUTORIAL = `
# Photosynthesis
Concept Spotlight: Plants eat light!
## What is it?
Photosynthesis is how plants make food.
## Why matters?
It gives us oxygen.
`;

const MOCK_QUIZ = [
  {
    question: "What do plants need?",
    options: ["Sunlight", "Pizza", "Cars"],
    correctAnswer: "Sunlight",
    explanation: "Plants use sunlight energy."
  },
  {
    question: "What is the output?",
    options: ["Oxygen", "Gold"],
    correctAnswer: "Oxygen",
    explanation: "They release Oxygen."
  }
];

const MOCK_FACTS = [
  "Plants can smell.",
  "Trees talk underground.",
  "Algae make most oxygen."
];

const MOCK_REPORT = {
  summary: "The student learned about plant biology.",
  highlights: ["Understood light energy", "Identified oxygen output"],
  recommendations: "Try gardening together."
};

test.describe('TutorBuddy Smoke Tests', () => {

  test.beforeEach(async ({ page }) => {
    // Intercept Gemini API calls
    await page.route('**/models/*generate*', async route => {
      const request = route.request();
      const postData = request.postDataJSON();
      
      // Determine what kind of request this is based on the prompt/contents
      const textContent = JSON.stringify(postData);
      
      let responseText = "";
      let isJson = false;
      let isImage = false;

      if (textContent.includes("Classify the safety")) {
        // Safety Check
        responseText = JSON.stringify({ isSafe: true, reason: "Safe topic" });
        isJson = true;
      } else if (textContent.includes("Generate 5 friendly MCQ")) {
        // Quiz Generation
        responseText = JSON.stringify(MOCK_QUIZ);
        isJson = true;
      } else if (textContent.includes("mind-blowing short facts")) {
        // Fun Facts
        responseText = JSON.stringify(MOCK_FACTS);
        isJson = true;
      } else if (textContent.includes("Generate a parent report")) {
        // Parent Report
        responseText = JSON.stringify(MOCK_REPORT);
        isJson = true;
      } else if (textContent.includes("Convert this lesson about")) {
        // Dialogue Generation (Text for TTS)
        responseText = "Hey Sam, did you know plants eat light? Wow Buddy that is cool!";
      } else if (textContent.includes("TTS conversation")) {
        // TTS Audio (return base64 audio mock)
        // We simulate a very short audio file structure
        isImage = true; // Reusing image structure for inlineData
      } else if (textContent.includes("illustration of")) {
        // Image Generation
        isImage = true;
      } else {
        // Default: Tutorial Generation
        responseText = MOCK_TUTORIAL;
      }

      // Construct the Google GenAI response format
      let responseBody;
      
      if (isImage) {
        responseBody = {
          candidates: [{
            content: {
              parts: [{
                inlineData: {
                  mimeType: textContent.includes("TTS") ? "audio/wav" : "image/png",
                  data: MOCK_IMAGE_B64
                }
              }]
            }
          }]
        };
      } else {
        responseBody = {
          candidates: [{
            content: {
              parts: [{ text: responseText }]
            }
          }]
        };
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(responseBody),
      });
    });

    await page.goto('/');
  });

  test('Landing Page loads and navigation works', async ({ page }) => {
    await expect(page).toHaveTitle(/TutorBuddy/);
    await expect(page.getByText('Mastery in Minutes')).toBeVisible();
    
    // Check navigation to About
    await page.getByRole('button', { name: 'About' }).first().click();
    await expect(page.getByText('Our Mission')).toBeVisible();
    
    // Go back
    await page.getByRole('button', { name: 'Back to Learning' }).click();
    await expect(page.getByText('Personalized Learning')).toBeVisible();
  });

  test('Full Lesson Generation Flow', async ({ page }) => {
    // 1. Fill Form
    await page.getByPlaceholder('e.g., Quantum Physics').fill('Photosynthesis');
    // Using default subject (Science) and age (10)
    
    // 2. Submit
    const generateBtn = page.getByRole('button', { name: 'Generate Mastery Canvas' });
    await expect(generateBtn).toBeEnabled();
    await generateBtn.click();

    // 3. Verify Loading State
    await expect(page.getByText('Creating your canvas...')).toBeVisible();
    await expect(page.getByText('Analyzing safety')).toBeVisible();

    // 4. Verify Result View Loads
    // Check Title
    await expect(page.getByRole('heading', { name: 'Photosynthesis', level: 1 })).toBeVisible({ timeout: 10000 });
    
    // Check Tutorial Content (Markdown rendering)
    await expect(page.getByText('Plants eat light!')).toBeVisible();

    // Check Fun Facts
    await expect(page.getByText('Plants can smell.')).toBeVisible();

    // Check Audio Button exists (Video generation mocked as image/audio in generic handler, but outputMode defaults to TEXT_AUDIO_IMAGES)
    await expect(page.getByRole('button', { name: 'Buddy Dialogue' })).toBeVisible();
  });

  test('Quiz Interaction works', async ({ page }) => {
    // Setup state directly or run through flow. Running through flow is safer for E2E.
    await page.getByPlaceholder('e.g., Quantum Physics').fill('Photosynthesis');
    await page.getByRole('button', { name: 'Generate Mastery Canvas' }).click();
    await expect(page.getByRole('heading', { name: 'Photosynthesis' })).toBeVisible();

    // Locate Quiz Section
    const quizSection = page.locator('section').filter({ hasText: 'Mastery Check' });
    await quizSection.scrollIntoViewIfNeeded();

    // Check Question
    await expect(quizSection.getByText('What do plants need?')).toBeVisible();

    // Select Wrong Answer first (assuming 'Pizza' is wrong based on mock)
    await quizSection.getByRole('button', { name: 'Pizza' }).click();
    await quizSection.getByRole('button', { name: 'Verify Answer' }).click();
    
    // Check for shake animation or error state (implied by retrying or red color classes, hard to test CSS animation directly, check class)
    // The component logic shakes on wrong answer but doesn't lock "isAnswered" if wrong? 
    // Wait, looking at code: handleCheck -> if correct setScore, else setShake. It ONLY sets isAnswered=true if correct?? 
    // Code review: "if (isCorrect) ... else setShake". It does NOT set isAnswered=true if wrong.
    // So we can try again.
    
    // Select Correct Answer
    await quizSection.getByRole('button', { name: 'Sunlight' }).click();
    await quizSection.getByRole('button', { name: 'Verify Answer' }).click();

    // Verify Success State
    await expect(quizSection.getByText("Buddy's Explanation")).toBeVisible();
    await expect(quizSection.getByText("Plants use sunlight energy.")).toBeVisible();

    // Next Question
    await quizSection.getByRole('button', { name: 'Next Challenge' }).click();
    await expect(quizSection.getByText('What is the output?')).toBeVisible();
  });

  test('Chat Interface works', async ({ page }) => {
    await page.getByPlaceholder('e.g., Quantum Physics').fill('Photosynthesis');
    await page.getByRole('button', { name: 'Generate Mastery Canvas' }).click();
    await expect(page.getByRole('heading', { name: 'Photosynthesis' })).toBeVisible();

    const chatInput = page.getByPlaceholder('Ask Buddy a question...');
    await chatInput.fill('How does it work?');
    
    // Mock the chat response specifically if needed, or rely on default tutorial mock
    // The current mock implementation returns "Photosynthesis..." for default text calls.
    // Let's refine mock if needed, but for smoke test, getting ANY response is success.
    
    await page.getByRole('button', { name: 'Send' }).click();

    // Verify user message appears
    await expect(page.getByText('How does it work?', { exact: true })).toBeVisible();
    
    // Verify bot thinking or response
    // The mock returns the Tutorial Markdown for unknown requests, which is fine for smoke test connectivity check.
    // We just want to ensure the UI updated.
    await expect(page.locator('.bg-white\\/10').last()).toBeVisible(); // Bot message bubble class
  });
});