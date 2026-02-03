
# 🧠 TutorBuddy: The Agentic Mastery Platform

**TutorBuddy** is a sophisticated, multi-modal AI tutoring application designed to democratize high-quality education. Built on **React 19** and powered by the latest **Google Gemini 3** and **Gemini 2.5** models, it transforms any topic into an immersive "Mastery Canvas" tailored to the student's age and subject.

> **Status**: v3.1 Preview
> **Powered By**: Google Gemini 3 Flash, Gemini 2.5 Flash (Audio/Image), Google Search Grounding

## 🚀 Key Capabilities

### 1. Agentic Workflow Orchestration
Unlike simple chatbots, TutorBuddy orchestrates **6+ parallel AI agents** to build a complete lesson plan instantly:
*   **Safety Agent**: Pre-screens topics for age-appropriateness and safety.
*   **Curriculum Agent**: Drafts structured lessons with **Google Search Grounding** to ensure factual accuracy.
*   **Visual Agent**: Generates 4 educational illustrations using **Gemini 2.5 Flash Image**.
*   **Diagram Agent**: Codes raw SVG vector diagrams for scientific/mathematical visualization using **Gemini 3 Flash**.
*   **Quiz Agent**: Creates adaptive multiple-choice assessments with immediate feedback.
*   **Report Agent**: Synthesizes a "Guardian Insights" report for parents.

### 2. Multi-Modal Learning Experience
*   **Emotional Audio Dialogues**: Uses **Gemini 2.5 Native Audio (TTS)** to generate multi-speaker podcasts between "Buddy" (the tutor) and "Sam" (a student persona), making learning auditory and emotional.
*   **Interactive Schematics**: Renders AI-generated SVG code into interactive diagrams (e.g., cell structures, geometry).
*   **Visual Slideshows**: A gallery of custom-generated visual aids.

### 3. Interactive Deep Dives & Chat
*   **Socratic Assistant ("Ask Buddy")**: A context-aware chat interface where students can ask follow-up questions.
*   **Deep Dive Engine**: Suggests interesting sub-topics and generates instant "Micro-Lessons" on demand without leaving the main view.

### 4. Contextual Vision (OCR)
*   **Homework Helper**: Students can upload photos of their textbooks or worksheets. TutorBuddy uses Gemini's vision capabilities to analyze the image and align the lesson with the specific school curriculum.

## 🛠️ Tech Stack & Model Usage

TutorBuddy leverages a "Thick Client" architecture where the frontend communicates directly with Google's GenAI APIs for low latency.

| Feature | Model / Technology | Implementation Details |
| :--- | :--- | :--- |
| **Reasoning & Orchestration** | `gemini-3-flash-preview` | JSON Schema output, Safety classification, Complex instruction following. |
| **Search Grounding** | `googleSearch` Tool | Ensures facts are up-to-date and cited (e.g., current events, scientific data). |
| **Code Generation** | `gemini-3-flash-preview` | Generates raw `<svg>` code for educational diagrams. |
| **Audio (TTS)** | `gemini-2.5-flash-preview-tts` | Multi-speaker configuration (`Puck` & `Kore`) for dynamic conversations. |
| **Image Generation** | `gemini-2.5-flash-image` | High-fidelity educational illustrations (16:9). |
| **Frontend Framework** | React 19 + Tailwind CSS | Fast, responsive UI with state machine management. |
| **Testing** | Playwright | Automated regression and UI testing. |

## 📦 Installation & Setup

TutorBuddy operates on a **BYOK (Bring Your Own Key)** model for privacy and scalability.

1.  **Clone the repository**
    ```bash
    git clone https://github.com/your-username/tutorbuddy.git
    cd tutorbuddy
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Run the development server**
    ```bash
    npm run dev
    ```

4.  **Connect API Key**
    The app integrates with Google AI Studio's key selection mechanism. Click "Connect Key" on the landing page to authorize your Google Cloud API key.

## 🛡️ Safety & Privacy
*   **Zero-Retention**: No user data is stored on external servers; history is persisted locally in the browser (`localStorage`).
*   **Safety Directives**: All API calls inject strict system instructions to ensure content is neutral, objective, and safe for children aged 5-17.
*   **Parental Loop**: The dedicated "Parent Report" keeps guardians informed about what their child is learning and how to support them.

---
*Built for the Google Gemini Developer Competition*
