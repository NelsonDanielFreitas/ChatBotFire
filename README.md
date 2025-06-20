# ChatBotFire: Fire Knowledge Chatbot with LLM and PDF Integration

A real-time chat application designed to facilitate conversations about fire-related topics. This project features a modern Next.js frontend and a Node.js backend, integrating a Large Language Model (LLM) via Ollama. Users can interact with the chatbot, which leverages advanced language understanding, and can upload PDF documents to enrich the LLM's knowledge base—especially with information about fire. This enables the chatbot to provide more accurate and context-aware answers about fire, fire safety, and related subjects.

## Project Structure

```
├── frontend/          # Next.js frontend application
└── server/           # Node.js backend server
```

## Prerequisites

- Node.js (v14 or higher)
- npm
- MongoDB (local installation or MongoDB Atlas account)

## Installation

### Frontend Setup

1. Navigate to the frontend directory:

```bash
cd frontend
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env.local` file in the frontend directory with the following variables:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

4. Start the development server:

```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

### Backend Setup

1. Navigate to the server directory:

```bash
cd server
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the server directory with the following structure and example values:

```env
PORT=3001
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/chatbot
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=1d
OLLAMA_API_URL=http://localhost:11434
OLLAMA_MODEL=llama2
VECTOR_DIMENSION=384
ENCRYPTION_KEY=your_encryption_key
```

4. Start the server:

```bash
npm run dev
```

The backend server will be available at `http://localhost:3001`

## Environment Variables

### Backend (.env)

- `PORT`: The port number for the backend server (default: 3001)
- `NODE_ENV`: The environment mode (e.g., development, production)
- `MONGODB_URI`: Your MongoDB connection string (e.g., mongodb://localhost:27017/chatbot or MongoDB Atlas URI)
- `JWT_SECRET`: Secret key for JWT token generation and verification
- `JWT_EXPIRE`: Expiration time for JWT tokens (e.g., 1d, 7d)
- `OLLAMA_API_URL`: The URL for the Ollama API (e.g., http://localhost:11434)
- `OLLAMA_MODEL`: The model name used by Ollama (e.g., llama2)
- `VECTOR_DIMENSION`: The dimension of the vector embeddings (e.g., 384)
- `ENCRYPTION_KEY`: Key used for encryption of sensitive data

### Frontend (.env.local)

- `NEXT_PUBLIC_API_URL`: The URL of your backend API (default: http://localhost:3001)

## Features

- Real-time messaging using WebSocket
- User authentication with JWT
- Modern UI with Next.js and Tailwind CSS
- RESTful API backend
- MongoDB database with Mongoose ODM
- Secure environment variable management

## Development

- Frontend runs on port 3000
- Backend runs on port 3001
- MongoDB should be running locally or accessible via MongoDB Atlas
- Make sure both servers are running for full functionality
