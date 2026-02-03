
import { test, expect } from '@playwright/test';
import { Buffer } from 'node:buffer';

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

test.describe('TutorBuddy Critical Regression Tests', () => {

  test.beforeEach(async ({ page }) => {
    // Intercept Gemini API calls
    await page.route('**/models/*generate*', async route => {
      const request = route.request();
      // Handle pre-flight or simple requests
      if (request.method() === 'OPTIONS') {
        await route.fulfill({ status: 200 });
        return;
      }

      const postData = request.postDataJSON();
      const textContent = JSON.stringify(postData);
      
      let responseText = "";
      let isJson = false;
      let isImage = false;
      let groundingMetadata = undefined;

      // Classify request type based on prompt content
      if (textContent.includes("Evaluate safety")) {
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
      } else if (textContent.includes("Convert this lesson about") || textContent.includes("Write a short, exciting")) {
        responseText = "Hey Sam, did you know plants eat light? Wow Buddy that is cool!";
      } else if (textContent.includes("TTS conversation")) {
        isImage = true; // API returns audio in inlineData similar to image
      } else if (textContent.includes("illustration of") || textContent.includes("Conceptual 3D visualization")) {
        isImage = true;
      } else {
        // Default: Tutorial Generation
        responseText = MOCK_TUTORIAL;
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

    // Mock generic Chat stream if necessary (though mostly handled above)
    await page.route('**/chats/*', async route => {
         const responseBody = {
            candidates: [{
                content: { parts: [{ text: "I am Buddy, and I am here to help!" }] }
            }]
        };
        await route.fulfill({ status: 200, body: JSON.stringify(responseBody) });
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

  test('Contextual Image Upload Flow (Vision)', async ({ page }) => {
    // Scroll to form
    await page.getByRole('button', { name: 'Start Learning' }).click();
    
    // Create a dummy image buffer
    const buffer = Buffer.from('mock-image-content');
    
    // Trigger file upload (hidden input)
    await page.locator('input[type="file"]').setInputFiles({
      name: 'homework.jpg',
      mimeType: 'image/jpeg',
      buffer: buffer
    });

    // Verify UI update
    await expect(page.getByText('Context Loaded')).toBeVisible();
    await expect(page.getByText('Scan school classwork')).not.toBeVisible();
  });

  test('Full Lesson Generation Flow with History', async ({ page }) => {
    await page.getByPlaceholder('e.g., Quantum Physics').fill('Photosynthesis');
    const generateBtn = page.getByRole('button', { name: 'Generate Mastery Canvas' });
    await expect(generateBtn).toBeEnabled();
    await generateBtn.click();

    // Loading State
    await expect(page.getByText('Creating your canvas...')).toBeVisible();
    await expect(page.getByText('Analyzing safety')).toBeVisible();

    // Result State
    await expect(page.getByRole('heading', { name: 'Photosynthesis', level: 1 })).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Plants eat light!')).toBeVisible();

    // Check Grounding Citation
    await expect(page.getByText('Plant Science')).toBeVisible();

    // Check Diagram Loaded (SVG existence)
    await expect(page.locator('svg').filter({ hasText: 'Chlorophyll' })).toBeVisible();

    // Check Parent Report visibility
    await expect(page.getByText('Guardian Insights')).toBeVisible();
    await expect(page.getByText('The student learned about plant biology.')).toBeVisible();

    // Reset Session (New Lesson)
    await page.getByRole('button', { name: 'New Lesson' }).click();
    await expect(page.getByText('Personalized Learning')).toBeVisible();

    // Verify History
    await expect(page.getByText('Recent Sessions')).toBeVisible();
    await expect(page.getByText('Photosynthesis').first()).toBeVisible();

    // Reload from History
    await page.getByText('Photosynthesis').first().click();
    await expect(page.getByRole('heading', { name: 'Photosynthesis', level: 1 })).toBeVisible();
  });

  test('Audio Player Interaction', async ({ page }) => {
    await page.getByPlaceholder('e.g., Quantum Physics').fill('Photosynthesis');
    await page.getByRole('button', { name: 'Generate Mastery Canvas' }).click();
    await expect(page.getByRole('heading', { name: 'Photosynthesis' })).toBeVisible();

    // Check Audio Button exists
    const audioBtn = page.getByRole('button', { name: 'Buddy Dialogue' });
    await expect(audioBtn).toBeVisible();

    // Attempt to play/stop. Due to auto-play logic, it might already be playing.
    // We check for "Stop Audio" visibility.
    try {
        await expect(page.getByRole('button', { name: 'Stop Audio' })).toBeVisible({ timeout: 3000 });
    } catch {
        // If not auto-playing, click to play
        await audioBtn.click();
        await expect(page.getByRole('button', { name: 'Stop Audio' })).toBeVisible();
    }
    
    // Click to Stop
    await page.getByRole('button', { name: 'Stop Audio' }).click();
    await expect(page.getByRole('button', { name: 'Buddy Dialogue' })).toBeVisible();
  });

  test('Quiz Interaction - Score and Feedback', async ({ page }) => {
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
    
    // Select Correct Answer (Oxygen)
    await quizSection.getByRole('button', { name: 'Oxygen' }).click();
    await quizSection.getByRole('button', { name: 'Verify Answer' }).click();

    // Finish Quiz
    await quizSection.getByRole('button', { name: 'Finish & Review' }).click();
    
    // Check Result Screen
    await expect(quizSection.getByText('Quiz Complete!')).toBeVisible();
    await expect(quizSection.getByText('1/2')).toBeVisible(); // 1 wrong, 1 correct
  });

  test('Deep Dive Feature', async ({ page }) => {
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
});
