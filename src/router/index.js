const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('../moduls/auth/auth.router');
const categoryRoutes = require('../moduls/product/category.router');
const customerRoutes = require('../moduls/custommer/custommer.router');
const productRoutes = require('../moduls/product/product.router');
const paymentLinkRoutes = require('../moduls/paymentlink/paymentlink.router');
const employeeRoutes = require('../moduls/employee/employee.router');
const locationRoutes = require('../moduls/location/location.router');

const notificationRoutes = require('../moduls/notification/notification.router');
const supplierRoutes = require('../moduls/suppliers/suppliers.router');
const purchaseOrderRoutes = require('../moduls/order/purchaseorder.router');

/**
 * @swagger
 * tags:
 *   name: System
 *   description: System health and information endpoints
 */

// Use routes
router.use('/auth', authRoutes);
router.use('/categories', categoryRoutes);
router.use('/customers', customerRoutes);
router.use('/products', productRoutes);
router.use('/payment-links', paymentLinkRoutes);
router.use('/employees', employeeRoutes);
router.use('/locations', locationRoutes);

router.use('/notifications', notificationRoutes);
router.use('/suppliers', supplierRoutes);
router.use('/purchase-orders', purchaseOrderRoutes);

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
 *                   example: "Welcome to HOTSPOT RETAIL Admin Backend API"
 *                 version:
 *                   type: string
 *                   example: "1.0.0"
 */
router.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Welcome to HOTSPOT RETAIL Admin Backend API',
        version: '1.0.0'
    });
});

module.exports = router;
