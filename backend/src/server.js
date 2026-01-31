import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';

// Import routes
import mediaRoutes from './routes/mediaRoutes.js';
import playlistRoutes from './routes/playlistRoutes.js';
import downloadRoutes from './routes/downloadRoutes.js';
import subtitleRoutes from './routes/subtitleRoutes.js';
import authRoutes from './routes/authRoutes.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Prisma Client
import { prisma } from './prisma.js';
export { prisma };

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/api/downloads/file', express.static(path.join(os.homedir(), 'Downloads', 'MediaPlayer')));

// Routes
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Media Player API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/playlists', playlistRoutes);
app.use('/api/downloads', downloadRoutes);
app.use('/api/subtitles', subtitleRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
        error: {
            message: err.message || 'Internal Server Error',
            status: err.status || 500
        }
    });
});

// Database connection
const connectDB = async () => {
    try {
        // Test the connection
        await prisma.$queryRaw`SELECT 1`;
        console.log('✓ SQLite database connected successfully');
    } catch (error) {
        console.error('✗ SQLite connection error:', error.message);
        console.log('⚠ Continuing without database connection');
    }
};

// Start server
const startServer = async () => {
    await connectDB();

    app.listen(PORT, () => {
        console.log(`\n🚀 Media Player Server`);
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log(`✓ Server running on port ${PORT}`);
        console.log(`✓ Environment: ${process.env.NODE_ENV}`);
        console.log(`✓ API URL: http://localhost:${PORT}/api`);
        console.log(`✓ Health check: http://localhost:${PORT}/api/health`);
        console.log(`✓ Database: SQLite (local)`);
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
    });
};

startServer();

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down gracefully...');
    await prisma.$disconnect();
    process.exit(0);
});

export default app;
