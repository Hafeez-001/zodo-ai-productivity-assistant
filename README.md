# Zodo: AI Productivity Partner

Zodo is a high-intelligence productivity application that leverages cognitive decision models and Markov decision processes to help you manage tasks with ease.

## Features
- **Voice/NLP Task Creation**: Capture thoughts naturally.
- **Smart Workload Meter**: Context-aware capacity tracking.
- **AI Plan Cleanup**: Automated suggestions for overloaded days.
- **Meeting Summarization**: Turn transcripts into action items.
- **Premium Dark Mode**: Seamless, high-aesthetic theme support.
- **Weekly Insights**: Data-driven productivity reports.

## Tech Stack
- **Frontend**: React, Vite, TailwindCSS, Framer Motion.
- **Backend**: Node.js, Express, MongoDB.
- **AI**: Google Gemini Pro & Flash.

## Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB Atlas connection
- Gemini API Key

### Installation
1. Clone the repository.
2. Run `npm run install-all` to install dependencies for both frontend and backend.
3. Configure `.env` files in the `backend/` directory.

### Running Locally
- Development: `npm run dev`
- Production: `npm run build` && `npm start`

## Deployment
Zodo is designed for monolithic deployment. The Express backend serves the React frontend assets in production mode.
For detailed instructions, see the [Deployment Plan](C:\Users\moham\.gemini\antigravity\brain\6cf67703-031c-439d-94a5-a1e6ec71bc21\deployment_plan.md).
