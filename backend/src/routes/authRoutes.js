import express from 'express';
import { register, login, getMe } from '../controllers/authController.js';
import auth from '../middleware/authMiddleware.js';

const router = express.Router();

// @route   POST api/auth/register
// @desc    Register user
// @access  Public
router.post('/register', register);

// @route   POST api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', login);

// @route   GET api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', auth, getMe);

export default router;
