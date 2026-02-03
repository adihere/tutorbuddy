# 🎓 TutorBuddy: The Agentic Mastery Platform
> **Hackathon Track**: Education / Multi-Modal AI / Gemini 3
> **Tagline**: "Mastery in Minutes. Powered by Gemini 3 Flash."

---

## 🚀 The Problem
*   **One-size-fits-all education** fails diverse learners.
*   **Private tutoring** is prohibitively expensive ($50+/hr).
*   **Static content** (textbooks/PDFs) lacks engagement and emotional connection.
*   **Parental disconnection**: Guardians often don't know what their child is learning or how to help.

## 💡 The Solution: TutorBuddy
TutorBuddy is an **Agentic AI Tutor** that empowers students aged 5–17. It transforms a simple topic request into a comprehensive, multi-modal **Mastery Canvas** instantly. It doesn't just "output text"—it orchestrates a complete educational experience.

### ✨ Key Differentiators (The "Wow" Factors)

1.  **Agentic Orchestration (Gemini 3 Flash)**
    *   Instead of a simple chat, TutorBuddy acts as an agent that plans a curriculum. It validates safety, researches the topic using **Google Search Grounding**, and structures a pedagogical lesson plan in real-time.
    *   *Feature*: **Contextual OCR**. Students can snap a photo of their homework, and TutorBuddy aligns its lesson with their specific school curriculum.

2.  **Hyper-Personalized Multi-Modality**
    *   **Visual Learners**: Receive 5 custom AI-generated diagrams and illustrations (Gemini 2.5 Image).
    *   **Auditory Learners**: Listen to an emotional, multi-speaker podcast-style dialogue between "Buddy" (the tutor) and "Sam" (the curious student) using **Gemini 2.5 Native Audio**.
    *   **Kinesthetic/Active Learners**: Interactive SVGs and "Deep Dive" micro-lessons that allow exploring tangents instantly.

3.  **Guardian Insights Loop**
    *   While the child learns, TutorBuddy acts as a consultant for the parent.
    *   Generates a dedicated **Parent Report** summarizing what was learned, highlighting cognitive wins, and suggesting offline activities to reinforce learning.

4.  **Safety-First Architecture**
    *   Built-in "Pre-Check" agent that screens topics for age-appropriateness and safety before generation begins.

---

## 🛠️ The Tech Stack & Why Gemini?

| Feature | Model / Technology | The "Why" for Judges |
| :--- | :--- | :--- |
| **Reasoning Engine** | **Gemini 3 Flash** | Selected for its sub-second latency and complex instruction following. It handles the "Orchestrator" role, managing 5 parallel streams without hallucinating safety rules. |
| **Visuals** | **Gemini 2.5 Flash Image** | Generates consistent, educational style illustrations instantly, crucial for visual learners. |
| **Audio/TTS** | **Gemini 2.5 Flash Audio** | The **Multi-Speaker** capability allows us to simulate a *Socratic Seminar* (Student asking, Teacher answering) rather than a mono-tone lecture. |
| **Diagrams** | **Gemini 3 Flash (Code)** | Used to generate raw SVG code. Gemini 3's coding ability allows it to draw perfect vector diagrams of cells, atoms, or geometry. |
| **Frontend** | **React 19 + Tailwind** | High-performance, responsive UI with fluid animations. |

---

## 🔮 Future Roadmap (Post-Hackathon)
1.  **Video Generation**: Integration with **Veo** for dynamic explainer videos (Architecture prepared in `geminiService.ts`).
2.  **Long-term Memory**: User profiles that track mastery over months.
3.  **Classroom Mode**: Teacher dashboard connecting to multiple student instances.

---

## 🎯 Hackathon Judging Checklist
- [x] **Innovation**: Uses latest Gemini 3 models for agentic workflow, not just text generation.
- [x] **Impact**: Democratizes high-quality private tutoring ($0 vs $50/hr).
- [x] **Technical Complexity**: Orchestrates 5+ parallel AI streams (Text, Quiz, Image, Audio, Safety).
- [x] **Design**: Polished, child-friendly, accessible UI with robust error handling.
