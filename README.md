# Tri-Model Reasoning System MVP

A frontend-only multi-model reasoning system featuring three specialized models: Thinker, Critic, and Judge. All models use Gemini API with system prompts (no fine-tuning required).

## Architecture

- **Thinker Model**: Provides initial reasoning and answers to user prompts
- **Critic Model**: Evaluates and critiques the Thinker's responses
- **Judge Model**: Synthesizes both perspectives to provide a final, improved judgment

## Project Structure

- `reasoning-dashboard/`: Frontend React application (Vite + React)
  - `src/App.jsx`: Main application with tri-model orchestration
  - `src/App.css`: Styling
  - `demo_cases.md`: 15 curated test prompts
  - `DEMO_SCRIPT.md`: Demo talking points
  - `PROMPTS.md`: System prompts documentation

## Setup

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Gemini API key ([Get one here](https://makersuite.google.com/app/apikey))

### Installation

1. Navigate to the reasoning-dashboard directory:
   ```bash
   cd reasoning-dashboard
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the `reasoning-dashboard` directory:
   ```bash
   VITE_GEMINI_API_KEY=your_api_key_here
   ```
   Replace `your_api_key_here` with your actual Gemini API key.

4. Run the frontend:
   ```bash
   npm run dev
   ```

5. Open your browser to the URL shown (typically `http://localhost:5173`)

## How It Works

1. **User submits a query** through the web interface
2. **Thinker** analyzes the question and provides initial reasoning
3. **Critic** evaluates the Thinker's response for accuracy, completeness, and logic
4. **Judge** synthesizes both to produce a final, improved answer

All three responses are displayed side-by-side for comparison.

## Demo

See `demo_cases.md` for 15 curated test prompts and `DEMO_SCRIPT.md` for talking points.

## Notes

- This is a frontend-only MVP - no backend server required
- API key is stored in `.env` file (never commit this to version control)
- All orchestration happens in the browser
- Uses Gemini 1.5 Flash model for fast responses
