# Multi-Model Judiciary Reasoning System (Thinker-Critic-Judge Architecture)
 
A multi-model reasoning chatbot system featuring three specialized models: Thinker, Critic, and Judge.

## Architecture

- **Thinker Model**: Provides initial answers to user prompts
- **Critic Model**: Evaluates and critiques the Thinker's responses
- **Judge Model**: Synthesizes both perspectives to provide a final judgment

## Project Structure

- `reasoning-dashboard/`: Frontend React application
  - `Capstone_Thinker_Model.ipynb`: Thinker model training notebook
  - `Capstone_Critic_Model.ipynb`: Critic model training notebook
  - `src/`: React frontend source code

## Setup

1. Navigate to the reasoning-dashboard directory
2. Install dependencies: `npm install`
3. Run the frontend: `npm run dev`

## Model Training

The models are fine-tuned using LoRA on Mistral-7B-Instruct-v0.2. See the respective notebook files for training details.

