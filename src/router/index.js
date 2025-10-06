const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('../moduls/auth/auth.router');
const categoryRoutes = require('../moduls/product/category.router');

/**
 * @swagger
 * tags:
 *   name: System
 *   description: System health and information endpoints
 */

// Use routes
router.use('/auth', authRoutes);
router.use('/categories', categoryRoutes);

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [System]
 *     responses:
 *       200:
 *         description: API is running
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "API is running"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-01-01T00:00:00.000Z"
 */
router.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'API is running',
        timestamp: new Date().toISOString()
    });
});

/**
 * @swagger
 * /api/:
 *   get:
 *     summary: API welcome message
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Welcome message
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Welcome to Growcify Admin Backend API"
 *                 version:
 *                   type: string
 *                   example: "1.0.0"
 */
router.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Welcome to Growcify Admin Backend API',
        version: '1.0.0'
    });
});

module.exports = router;
