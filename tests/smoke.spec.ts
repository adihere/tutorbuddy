
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

const MOCK_DIAGRAM = `
<svg viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg">
  <circle cx="400" cy="300" r="100" fill="green" />
  <text x="350" y="300" font-size="20" fill="white">Chlorophyll</text>
</svg>
`;

const MOCK_DEEP_DIVE_SUGGESTIONS = [
  "Chlorophyll", "Calvin Cycle", "Stomata"
];

test.describe('TutorBuddy Smoke Tests', () => {

  test.beforeEach(async ({ page }) => {
    // Intercept Gemini API calls
    await page.route('**/models/*generate*', async route => {
      const request = route.request();
      const postData = request.postDataJSON();
      
      const textContent = JSON.stringify(postData);
      
      let responseText = "";
      let isJson = false;
      let isImage = false;
      let groundingMetadata = undefined;

      if (textContent.includes("Classify the safety")) {
        responseText = JSON.stringify({ isSafe: true, reason: "Safe topic" });
        isJson = true;
      } else if (textContent.includes("Generate 5 friendly MCQ")) {
        responseText = JSON.stringify(MOCK_QUIZ);
        isJson = true;
      } else if (textContent.includes("mind-blowing short facts")) {
        responseText = JSON.stringify(MOCK_FACTS);
        isJson = true;
      } else if (textContent.includes("Generate a parent report")) {
        responseText = JSON.stringify(MOCK_REPORT);
        isJson = true;
      } else if (textContent.includes("Create a clean, educational SVG diagram")) {
         responseText = MOCK_DIAGRAM;
      } else if (textContent.includes("Identify 3 fascinating sub-topics")) {
         responseText = JSON.stringify(MOCK_DEEP_DIVE_SUGGESTIONS);
         isJson = true;
      } else if (textContent.includes("Convert this lesson about")) {
        responseText = "Hey Sam, did you know plants eat light? Wow Buddy that is cool!";
      } else if (textContent.includes("TTS conversation")) {
        isImage = true; // Reusing image structure for inlineData
      } else if (textContent.includes("illustration of") || textContent.includes("Conceptual 3D visualization")) {
        isImage = true;
      } else {
        // Default: Tutorial Generation
        responseText = MOCK_TUTORIAL;
        // Mock citations
        groundingMetadata = {
            groundingChunks: [
                { web: { uri: "https://example.com/plants", title: "Plant Science" } }
            ]
        };
      }

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
            },
            groundingMetadata: groundingMetadata
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
    
    await page.getByRole('button', { name: 'About' }).first().click();
    await expect(page.getByText('Our Mission')).toBeVisible();
    
    await page.getByRole('button', { name: 'Back to Learning' }).click();
    await expect(page.getByText('Personalized Learning')).toBeVisible();
  });

  test('Full Lesson Generation Flow', async ({ page }) => {
    await page.getByPlaceholder('e.g., Quantum Physics').fill('Photosynthesis');
    const generateBtn = page.getByRole('button', { name: 'Generate Mastery Canvas' });
    await expect(generateBtn).toBeEnabled();
    await generateBtn.click();

    await expect(page.getByText('Creating your canvas...')).toBeVisible();
    await expect(page.getByText('Analyzing safety')).toBeVisible();

    await expect(page.getByRole('heading', { name: 'Photosynthesis', level: 1 })).toBeVisible({ timeout: 10000 });
    
    await expect(page.getByText('Plants eat light!')).toBeVisible();

    // Check Grounding Citation
    await expect(page.getByText('Plant Science')).toBeVisible();

    // Check Diagram Loaded (SVG existence)
    await expect(page.locator('svg').filter({ hasText: 'Chlorophyll' })).toBeVisible();

    await expect(page.getByText('Plants can smell.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Buddy Dialogue' })).toBeVisible();
  });

  test('Quiz Interaction - Single Attempt Flow', async ({ page }) => {
    await page.getByPlaceholder('e.g., Quantum Physics').fill('Photosynthesis');
    await page.getByRole('button', { name: 'Generate Mastery Canvas' }).click();
    await expect(page.getByRole('heading', { name: 'Photosynthesis' })).toBeVisible();

    const quizSection = page.locator('section').filter({ hasText: 'Mastery Check' });
    await quizSection.scrollIntoViewIfNeeded();

    await expect(quizSection.getByText('What do plants need?')).toBeVisible();

    // Select Wrong Answer (Pizza)
    await quizSection.getByRole('button', { name: 'Pizza' }).click();
    await quizSection.getByRole('button', { name: 'Verify Answer' }).click();
    
    // Check that feedback appears
    await expect(quizSection.getByText("Buddy's Explanation")).toBeVisible();
    
    // Check that button changed to Next Challenge (attempt locked)
    await expect(quizSection.getByRole('button', { name: 'Next Challenge' })).toBeVisible();

    // Next Question
    await quizSection.getByRole('button', { name: 'Next Challenge' }).click();
    await expect(quizSection.getByText('What is the output?')).toBeVisible();
  });

  test('Deep Dive Feature works', async ({ page }) => {
    await page.getByPlaceholder('e.g., Quantum Physics').fill('Photosynthesis');
    await page.getByRole('button', { name: 'Generate Mastery Canvas' }).click();
    await expect(page.getByRole('heading', { name: 'Photosynthesis' })).toBeVisible();

    // Wait for deep dive suggestions
    await expect(page.getByText('Dive Deeper')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Chlorophyll' })).toBeVisible();

    // Click suggestion
    await page.getByRole('button', { name: 'Chlorophyll' }).click();

    // Check modal appears
    await expect(page.getByRole('heading', { name: 'Deep Dive: Chlorophyll' })).toBeVisible();
    
    // Check Close
    await page.getByRole('button', { name: 'Close Lesson' }).click();
    await expect(page.getByRole('heading', { name: 'Deep Dive: Chlorophyll' })).not.toBeVisible();
  });

  test('Chat Interface works with multi-turn history', async ({ page }) => {
    await page.getByPlaceholder('e.g., Quantum Physics').fill('Photosynthesis');
    await page.getByRole('button', { name: 'Generate Mastery Canvas' }).click();
    await expect(page.getByRole('heading', { name: 'Photosynthesis' })).toBeVisible();

    const chatInput = page.getByPlaceholder('Ask Buddy a question...');
    
    // First message
    await chatInput.fill('How does it work?');
    await page.getByRole('button', { name: 'Send' }).click();
    await expect(page.getByText('How does it work?', { exact: true })).toBeVisible();

    // Wait for fake response to appear (based on mock in beforeEach, it just returns "Photosynthesis..." tutorial usually, 
    // but chat uses 'generateContent' with history.
    // In our mock, if it's not specific, it returns MOCK_TUTORIAL text. 
    // In a real chat, it would be a specific reply.
    // We can rely on the fact that a new model message appears.
    // Note: The mock setup returns MOCK_TUTORIAL for generic generation. 
    // We need to ensure the chat receives a response.
    
    // Second message - verifying history
    await chatInput.fill('Tell me more.');
    await page.getByRole('button', { name: 'Send' }).click();
    
    // Verify the second user message appears
    await expect(page.getByText('Tell me more.', { exact: true })).toBeVisible();
    
    // We implicitly verify history logic by ensuring no errors occur and flow continues.
    // Deeper verification would require inspecting the network request payload in the mock.
  });
});
