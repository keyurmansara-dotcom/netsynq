import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import helmet from 'helmet';
import mongoose from 'mongoose';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { Server } from 'socket.io';
import authRoutes from './routes/authRoutes.js';
import jobRoutes from './routes/jobRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import networkRoutes from './routes/networkRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import postRoutes from './routes/postRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import searchRoutes from './routes/searchRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import { setRealtimeServer } from './services/realtimeService.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));
app.use(express.json());
app.use(cookieParser());

const envClientUrls = [
  process.env.CLIENT_URL,
  process.env.CLIENT_URLS
]
  .filter(Boolean)
  .flatMap((value) => String(value).split(',').map((v) => v.trim()).filter(Boolean));

const allowedOrigins = new Set([
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  ...envClientUrls
]);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: Array.from(allowedOrigins),
    credentials: true
  }
});

setRealtimeServer(io);
app.set('io', io);

io.on('connection', (socket) => {
  const { userId } = socket.handshake.query || {};
  if (userId) {
    socket.join(`user:${userId}`);
  }

  socket.on('join:conversation', (conversationId) => {
    if (conversationId) {
      socket.join(`conversation:${conversationId}`);
    }
  });

  socket.on('leave:conversation', (conversationId) => {
    if (conversationId) {
      socket.leave(`conversation:${conversationId}`);
    }
  });
});

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser clients (no origin header) like Postman/curl.
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.has(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true
}));

app.get('/favicon.ico', (_req, res) => res.status(204).end());

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/network', networkRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/upload', uploadRoutes);

// Database Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch((err) => console.error('MongoDB connection error:', err));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});