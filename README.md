# ChatBot with MongoDB

A real-time chat application built with Next.js frontend and Node.js backend, using MongoDB with Mongoose for data persistence and real-time messaging capabilities.

## Project Structure

```
├── frontend/          # Next.js frontend application
└── server/           # Node.js backend server
```

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
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
# or
yarn install
```

3. Create a `.env.local` file in the frontend directory with the following variables:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

4. Start the development server:

```bash
npm run dev
# or
yarn dev
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
# or
yarn install
```

3. Create a `.env` file in the server directory with the following variables:

```env
PORT=3001
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
```

4. Start the server:

```bash
npm run dev
# or
yarn dev
```

The backend server will be available at `http://localhost:3001`

## Environment Variables

### Frontend (.env.local)

- `NEXT_PUBLIC_API_URL`: The URL of your backend API (default: http://localhost:3001)

### Backend (.env)

- `PORT`: The port number for the backend server (default: 3001)
- `MONGODB_URI`: Your MongoDB connection string (e.g., mongodb://localhost:27017/chatbot or MongoDB Atlas URI)
- `JWT_SECRET`: Secret key for JWT token generation and verification

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

## Security Notes

- Never commit `.env` or `.env.local` files to version control
- Keep your MongoDB connection string and JWT secret secure
- Use environment variables for all sensitive information
- Ensure proper authentication and authorization in your API endpoints
