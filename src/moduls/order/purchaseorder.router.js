const express = require('express');
const router = express.Router();
const {
    createPurchaseOrder,
    getAllPurchaseOrders,
    getPurchaseOrderById,
    updatePurchaseOrder,
    deletePurchaseOrder,
    bulkDeletePurchaseOrders,
    updateOrderStatus,
    getPurchaseOrderStats,
    duplicatePurchaseOrder,
    exportPurchaseOrders
} = require('./purchaseorder.controller');

// Middleware for authentication (uncomment when auth is implemented)
// const { authenticate } = require('../../middleware/auth.middleware');

// Apply authentication middleware to all routes (uncomment when auth is implemented)
// router.use(authenticate);

/**
 * @swagger
 * components:
 *   schemas:
 *     OrderItem:
 *       type: object
 *       required:
 *         - product
 *         - productName
 *         - category
 *         - unitPrice
 *         - quantity
 *       properties:
 *         product:
 *           type: string
 *           description: Product ID reference
 *         productName:
 *           type: string
 *           description: Name of the product
 *         category:
 *           type: string
 *           description: Category ID reference
 *         unitPrice:
 *           type: number
 *           minimum: 0
 *           description: Price per unit
 *         quantity:
 *           type: number
 *           minimum: 1
 *           description: Quantity ordered
 *         totalPrice:
 *           type: number
 *           description: Total price for this item (calculated)
 *     
 *     PurchaseOrder:
 *       type: object
 *       required:
 *         - vendor
 *         - expectedDelivery
 *         - orderItems
 *       properties:
 *         orderNumber:
 *           type: string
 *           description: Auto-generated unique order number
 *         vendor:
 *           type: string
 *           description: Supplier/Vendor ID reference
 *         purchaseDate:
 *           type: string
 *           format: date
 *           description: Date of purchase order
 *         expectedDelivery:
 *           type: string
 *           format: date
 *           description: Expected delivery date
 *         paymentTerms:
 *           type: string
 *           enum: [Net 30 Days, Net 15 Days, Net 7 Days, Immediate, COD, Advance Payment]
 *           default: Net 30 Days
 *         priority:
 *           type: string
 *           enum: [Low, Medium, High, Urgent]
 *           default: Medium
 *         status:
 *           type: string
 *           enum: [Draft, Pending, Confirmed, Shipped, Delivered, Cancelled, Returned]
 *           default: Draft
 *         orderItems:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/OrderItem'
 *         taxRate:
 *           type: number
 *           minimum: 0
 *           maximum: 100
 *           default: 18
 *         shippingCost:
 *           type: number
 *           minimum: 0
 *           default: 0
 *         discount:
 *           type: number
 *           minimum: 0
 *           default: 0
 *         notes:
 *           type: string
 *           maxLength: 1000
 *         isRecurring:
 *           type: boolean
 *           default: false
 *         recurringFrequency:
 *           type: string
 *           enum: [Weekly, Monthly, Quarterly, Yearly]
 *     
 *     PurchaseOrderResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         message:
 *           type: string
 *         data:
 *           $ref: '#/components/schemas/PurchaseOrder'
 */

/**
 * @swagger
 * /api/purchase-orders:
 *   post:
 *     summary: Create a new purchase order
 *     tags: [Purchase Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PurchaseOrder'
 *     responses:
 *       201:
 *         description: Purchase order created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PurchaseOrderResponse'
 *       400:
 *         description: Bad request - validation error
 *       404:
 *         description: Vendor not found
 *       409:
 *         description: Order number already exists
 *       500:
 *         description: Internal server error
 */
router.post('/', createPurchaseOrder);

/**
 * @swagger
 * /api/purchase-orders:
 *   get:
 *     summary: Get all purchase orders with filtering and pagination
 *     tags: [Purchase Orders]
 *     parameters:
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
 *           maximum: 100
 *         description: Number of items per page
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
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
 *           enum: [Draft, Pending, Confirmed, Shipped, Delivered, Cancelled, Returned]
 *         description: Filter by status
 *       - in: query
 *         name: vendor
 *         schema:
 *           type: string
 *         description: Filter by vendor ID
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [Low, Medium, High, Urgent]
 *         description: Filter by priority
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter orders from this date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter orders until this date
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in order number and notes
 *       - in: query
 *         name: deliveryStatus
 *         schema:
 *           type: string
 *           enum: [On Time, Due Soon, Overdue, Delivered, Cancelled]
 *         description: Filter by delivery status
 *     responses:
 *       200:
 *         description: Purchase orders retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/PurchaseOrder'
 *                 meta:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     totalCount:
 *                       type: integer
 *                     pageSize:
 *                       type: integer
 *                     hasNext:
 *                       type: boolean
 *                     hasPrev:
 *                       type: boolean
 *       500:
 *         description: Internal server error
 */
router.get('/', getAllPurchaseOrders);

/**
 * @swagger
 * /api/purchase-orders/stats:
 *   get:
 *     summary: Get purchase order statistics
 *     tags: [Purchase Orders]
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     statusStats:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           count:
 *                             type: integer
 *                           totalAmount:
 *                             type: number
 *                     totalOrders:
 *                       type: integer
 *                     overdueOrders:
 *                       type: integer
 *                     recentOrders:
 *                       type: array
 *       500:
 *         description: Internal server error
 */
router.get('/stats', getPurchaseOrderStats);

/**
 * @swagger
 * /api/purchase-orders/export:
 *   get:
 *     summary: Export purchase orders to CSV
 *     tags: [Purchase Orders]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by status
 *       - in: query
 *         name: vendor
 *         schema:
 *           type: string
 *         description: Filter by vendor ID
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *         description: Filter by priority
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter from date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter to date
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term
 *     responses:
 *       200:
 *         description: CSV file download
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *       500:
 *         description: Internal server error
 */
router.get('/export', exportPurchaseOrders);

/**
 * @swagger
 * /api/purchase-orders/bulk-delete:
 *   post:
 *     summary: Bulk delete purchase orders
 *     tags: [Purchase Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderIds
 *             properties:
 *               orderIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of order IDs to delete
 *     responses:
 *       200:
 *         description: Orders deleted successfully
 *       400:
 *         description: Invalid request or cannot delete shipped/delivered orders
 *       500:
 *         description: Internal server error
 */
router.post('/bulk-delete', bulkDeletePurchaseOrders);

/**
 * @swagger
 * /api/purchase-orders/{id}:
 *   get:
 *     summary: Get purchase order by ID
 *     tags: [Purchase Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Purchase order ID
 *     responses:
 *       200:
 *         description: Purchase order retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PurchaseOrderResponse'
 *       400:
 *         description: Invalid ID format
 *       404:
 *         description: Purchase order not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id', getPurchaseOrderById);

/**
 * @swagger
 * /api/purchase-orders/{id}:
 *   put:
 *     summary: Update purchase order
 *     tags: [Purchase Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Purchase order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PurchaseOrder'
 *     responses:
 *       200:
 *         description: Purchase order updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PurchaseOrderResponse'
 *       400:
 *         description: Bad request - validation error or invalid status transition
 *       404:
 *         description: Purchase order or vendor not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id', updatePurchaseOrder);

/**
 * @swagger
 * /api/purchase-orders/{id}:
 *   delete:
 *     summary: Delete purchase order (soft delete)
 *     tags: [Purchase Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Purchase order ID
 *     responses:
 *       200:
 *         description: Purchase order deleted successfully
 *       400:
 *         description: Invalid ID or cannot delete shipped/delivered orders
 *       404:
 *         description: Purchase order not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', deletePurchaseOrder);

/**
 * @swagger
 * /api/purchase-orders/{id}/status:
 *   patch:
 *     summary: Update purchase order status
 *     tags: [Purchase Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Purchase order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [Draft, Pending, Confirmed, Shipped, Delivered, Cancelled, Returned]
 *               cancellationReason:
 *                 type: string
 *                 description: Required when status is 'Cancelled'
 *     responses:
 *       200:
 *         description: Status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PurchaseOrderResponse'
 *       400:
 *         description: Bad request - invalid status or status transition
 *       404:
 *         description: Purchase order not found
 *       500:
 *         description: Internal server error
 */
router.patch('/:id/status', updateOrderStatus);

/**
 * @swagger
 * /api/purchase-orders/{id}/duplicate:
 *   post:
 *     summary: Duplicate an existing purchase order
 *     tags: [Purchase Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Purchase order ID to duplicate
 *     responses:
 *       201:
 *         description: Purchase order duplicated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PurchaseOrderResponse'
 *       400:
 *         description: Invalid ID format
 *       404:
 *         description: Purchase order not found
 *       500:
 *         description: Internal server error
 */
router.post('/:id/duplicate', duplicatePurchaseOrder);

module.exports = router;
