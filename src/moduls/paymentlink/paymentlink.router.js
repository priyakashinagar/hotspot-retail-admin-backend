const express = require('express');
const router = express.Router();
const {
    createPaymentLink,
    getAllPaymentLinks,
    getPaymentLinkById,
    getPaymentLinkByLinkId,
    updatePaymentLink,
    deletePaymentLink,
    cancelPaymentLink,
    activatePaymentLink,
    recordPayment,
    getPaymentLinkStats,
    searchPaymentLinks
} = require('./paymentlink.controller');
const auth = require('../../middleware/auth.middleware');

/**
 * @swagger
 * components:
 *   schemas:
 *     PaymentLink:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Payment link ID
 *         title:
 *           type: string
 *           description: Payment link title
 *         amount:
 *           type: number
 *           description: Payment amount
 *         currency:
 *           type: string
 *           enum: [INR, USD, EUR, GBP]
 *           description: Currency code
 *         customerName:
 *           type: string
 *           description: Customer name
 *         customerEmail:
 *           type: string
 *           description: Customer email address
 *         description:
 *           type: string
 *           description: Payment description
 *         expiryDate:
 *           type: string
 *           format: date-time
 *           description: Payment link expiry date
 *         allowPartialPayment:
 *           type: boolean
 *           description: Allow partial payments
 *         sendEmailNotification:
 *           type: boolean
 *           description: Send email notification to customer
 *         sendSmsNotification:
 *           type: boolean
 *           description: Send SMS notification to customer
 *         paymentLinkId:
 *           type: string
 *           description: Unique payment link identifier
 *         shortUrl:
 *           type: string
 *           description: Short URL for payment link
 *         status:
 *           type: string
 *           enum: [Active, Expired, Paid, Cancelled, Partially Paid]
 *           description: Payment link status
 *         paymentStatus:
 *           type: string
 *           enum: [Pending, Completed, Failed, Partially Paid, Refunded]
 *           description: Payment status
 *         paidAmount:
 *           type: number
 *           description: Amount already paid
 *         remainingAmount:
 *           type: number
 *           description: Remaining amount to be paid
 *         paymentGateway:
 *           type: string
 *           enum: [Razorpay, Stripe, PayPal, Paytm]
 *           description: Payment gateway
 *         clickCount:
 *           type: number
 *           description: Number of times link was accessed
 *         paymentUrl:
 *           type: string
 *           description: Full payment URL
 *         paymentPercentage:
 *           type: number
 *           description: Payment completion percentage
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     PaymentLinkCreateRequest:
 *       type: object
 *       required:
 *         - title
 *         - amount
 *         - customerEmail
 *       properties:
 *         title:
 *           type: string
 *           minLength: 3
 *           maxLength: 200
 *           description: Payment link title
 *           example: "Invoice Payment - #INV001"
 *         amount:
 *           type: number
 *           minimum: 0.01
 *           description: Payment amount
 *           example: 1500
 *         currency:
 *           type: string
 *           enum: [INR, USD, EUR, GBP]
 *           default: INR
 *           description: Currency code
 *           example: "INR"
 *         customerName:
 *           type: string
 *           maxLength: 100
 *           description: Customer name
 *           example: "John Doe"
 *         customerEmail:
 *           type: string
 *           format: email
 *           description: Customer email address
 *           example: "john.doe@example.com"
 *         description:
 *           type: string
 *           maxLength: 1000
 *           description: Payment description
 *           example: "Payment for services rendered"
 *         expiryDate:
 *           type: string
 *           format: date-time
 *           description: Payment link expiry date
 *           example: "2024-12-31T23:59:59Z"
 *         allowPartialPayment:
 *           type: boolean
 *           default: false
 *           description: Allow partial payments
 *           example: false
 *         sendEmailNotification:
 *           type: boolean
 *           default: true
 *           description: Send email notification to customer
 *           example: true
 *         sendSmsNotification:
 *           type: boolean
 *           default: true
 *           description: Send SMS notification to customer
 *           example: true
 *         paymentGateway:
 *           type: string
 *           enum: [Razorpay, Stripe, PayPal, Paytm]
 *           default: Razorpay
 *           description: Payment gateway
 *           example: "Razorpay"
 *     PaymentLinkStats:
 *       type: object
 *       properties:
 *         totalLinks:
 *           type: number
 *           description: Total number of payment links
 *         activeLinks:
 *           type: number
 *           description: Number of active payment links
 *         paidLinks:
 *           type: number
 *           description: Number of paid payment links
 *         expiredLinks:
 *           type: number
 *           description: Number of expired payment links
 *         totalAmount:
 *           type: number
 *           description: Total amount of all payment links
 *         totalPaidAmount:
 *           type: number
 *           description: Total amount paid
 *         pendingAmount:
 *           type: number
 *           description: Total pending amount
 *         totalClickCount:
 *           type: number
 *           description: Total clicks on all payment links
 *         conversionRate:
 *           type: string
 *           description: Conversion rate percentage
 */

/**
 * @swagger
 * tags:
 *   name: Payment Links
 *   description: Payment link management endpoints
 */

/**
 * @swagger
 * /api/payment-links:
 *   post:
 *     summary: Create a new payment link
 *     tags: [Payment Links]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PaymentLinkCreateRequest'
 *     responses:
 *       201:
 *         description: Payment link created successfully
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
 *                   example: "Payment link created successfully"
 *                 data:
 *                   $ref: '#/components/schemas/PaymentLink'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Payment link with this title already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/', auth, createPaymentLink);

/**
 * @swagger
 * /api/payment-links:
 *   get:
 *     summary: Get all payment links with pagination and filters
 *     tags: [Payment Links]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for title, customer name, email, or payment link ID
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, updatedAt, title, amount, status]
 *           default: createdAt
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Active, Expired, Paid, Cancelled, Partially Paid]
 *         description: Filter by status
 *       - in: query
 *         name: paymentStatus
 *         schema:
 *           type: string
 *           enum: [Pending, Completed, Failed, Partially Paid, Refunded]
 *         description: Filter by payment status
 *       - in: query
 *         name: currency
 *         schema:
 *           type: string
 *           enum: [INR, USD, EUR, GBP]
 *         description: Filter by currency
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for date range filter
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for date range filter
 *     responses:
 *       200:
 *         description: Payment links retrieved successfully
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
 *                   example: "Payment links retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     paymentLinks:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/PaymentLink'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         currentPage:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *                         totalPaymentLinks:
 *                           type: integer
 *                         hasNextPage:
 *                           type: boolean
 *                         hasPrevPage:
 *                           type: boolean
 *                         limit:
 *                           type: integer
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/', auth, getAllPaymentLinks);

/**
 * @swagger
 * /api/payment-links/search:
 *   get:
 *     summary: Search payment links with advanced filters
 *     tags: [Payment Links]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by status
 *       - in: query
 *         name: paymentStatus
 *         schema:
 *           type: string
 *         description: Filter by payment status
 *     responses:
 *       200:
 *         description: Payment links searched successfully
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
 *                   example: "Payment links searched successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     paymentLinks:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/PaymentLink'
 *                     pagination:
 *                       type: object
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/search', auth, searchPaymentLinks);

/**
 * @swagger
 * /api/payment-links/stats:
 *   get:
 *     summary: Get payment link statistics
 *     tags: [Payment Links]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Payment link statistics retrieved successfully
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
 *                   example: "Payment link statistics retrieved successfully"
 *                 data:
 *                   $ref: '#/components/schemas/PaymentLinkStats'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/stats', auth, getPaymentLinkStats);

/**
 * @swagger
 * /api/payment-links/public/{linkId}:
 *   get:
 *     summary: Get payment link by link ID (public endpoint)
 *     tags: [Payment Links]
 *     parameters:
 *       - in: path
 *         name: linkId
 *         required: true
 *         schema:
 *           type: string
 *         description: Payment link ID
 *     responses:
 *       200:
 *         description: Payment link retrieved successfully
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
 *                   example: "Payment link retrieved successfully"
 *                 data:
 *                   $ref: '#/components/schemas/PaymentLink'
 *       404:
 *         description: Payment link not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       410:
 *         description: Payment link has expired
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Payment link is already paid
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/public/:linkId', getPaymentLinkByLinkId);

/**
 * @swagger
 * /api/payment-links/{id}:
 *   get:
 *     summary: Get payment link by ID
 *     tags: [Payment Links]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Payment link ID
 *     responses:
 *       200:
 *         description: Payment link retrieved successfully
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
 *                   example: "Payment link retrieved successfully"
 *                 data:
 *                   $ref: '#/components/schemas/PaymentLink'
 *       400:
 *         description: Invalid payment link ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Payment link not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/:id', auth, getPaymentLinkById);

/**
 * @swagger
 * /api/payment-links/{id}:
 *   put:
 *     summary: Update payment link
 *     tags: [Payment Links]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Payment link ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               amount:
 *                 type: number
 *               currency:
 *                 type: string
 *               customerName:
 *                 type: string
 *               customerEmail:
 *                 type: string
 *               description:
 *                 type: string
 *               expiryDate:
 *                 type: string
 *                 format: date-time
 *               allowPartialPayment:
 *                 type: boolean
 *               sendEmailNotification:
 *                 type: boolean
 *               sendSmsNotification:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Payment link updated successfully
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
 *                   example: "Payment link updated successfully"
 *                 data:
 *                   $ref: '#/components/schemas/PaymentLink'
 *       400:
 *         description: Validation error or invalid ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Payment link not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Cannot update payment link that has been paid
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.put('/:id', auth, updatePaymentLink);

/**
 * @swagger
 * /api/payment-links/{id}:
 *   delete:
 *     summary: Delete payment link
 *     tags: [Payment Links]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Payment link ID
 *     responses:
 *       200:
 *         description: Payment link deleted successfully
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
 *                   example: "Payment link deleted successfully"
 *       400:
 *         description: Invalid payment link ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Payment link not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Cannot delete payment link that has received payments
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete('/:id', auth, deletePaymentLink);

/**
 * @swagger
 * /api/payment-links/{id}/cancel:
 *   patch:
 *     summary: Cancel payment link
 *     tags: [Payment Links]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Payment link ID
 *     responses:
 *       200:
 *         description: Payment link cancelled successfully
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
 *                   example: "Payment link cancelled successfully"
 *                 data:
 *                   $ref: '#/components/schemas/PaymentLink'
 *       400:
 *         description: Invalid payment link ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Payment link not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Cannot cancel a paid payment link
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.patch('/:id/cancel', auth, cancelPaymentLink);

/**
 * @swagger
 * /api/payment-links/{id}/activate:
 *   patch:
 *     summary: Activate payment link
 *     tags: [Payment Links]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Payment link ID
 *     responses:
 *       200:
 *         description: Payment link activated successfully
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
 *                   example: "Payment link activated successfully"
 *                 data:
 *                   $ref: '#/components/schemas/PaymentLink'
 *       400:
 *         description: Invalid payment link ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Payment link not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Cannot activate expired payment link
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.patch('/:id/activate', auth, activatePaymentLink);

/**
 * @swagger
 * /api/payment-links/{id}/payment:
 *   post:
 *     summary: Record payment for payment link
 *     tags: [Payment Links]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Payment link ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - transactionId
 *               - paymentMethod
 *             properties:
 *               amount:
 *                 type: number
 *                 minimum: 0.01
 *                 description: Payment amount
 *                 example: 500
 *               transactionId:
 *                 type: string
 *                 description: Transaction ID from payment gateway
 *                 example: "TXN_123456789"
 *               paymentMethod:
 *                 type: string
 *                 enum: [Card, UPI, Net Banking, Wallet]
 *                 description: Payment method used
 *                 example: "UPI"
 *               gatewayPaymentId:
 *                 type: string
 *                 description: Payment ID from gateway
 *                 example: "pay_123456789"
 *               gatewayOrderId:
 *                 type: string
 *                 description: Order ID from gateway
 *                 example: "order_123456789"
 *               transactionFee:
 *                 type: number
 *                 minimum: 0
 *                 description: Transaction fee charged
 *                 example: 10.50
 *     responses:
 *       200:
 *         description: Payment recorded successfully
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
 *                   example: "Payment recorded successfully"
 *                 data:
 *                   $ref: '#/components/schemas/PaymentLink'
 *       400:
 *         description: Invalid payment data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Payment link not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/:id/payment', auth, recordPayment);

module.exports = router;
