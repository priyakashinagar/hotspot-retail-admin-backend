const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middleware/auth.middleware');
const {
    createNotification,
    getAllNotifications,
    getNotificationById,
    updateNotification,
    deleteNotification,
    getUserNotifications,
    markAsRead,
    markAllAsRead,
    sendImmediateNotification,
    getNotificationStats,
    getScheduledNotifications,
    cancelScheduledNotification
} = require('./notification.controller');

/**
 * @swagger
 * components:
 *   schemas:
 *     Notification:
 *       type: object
 *       required:
 *         - title
 *         - message
 *         - type
 *         - priority
 *         - createdBy
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated id of the notification
 *         title:
 *           type: string
 *           minLength: 3
 *           maxLength: 200
 *           description: The notification title
 *           example: "System Maintenance Alert"
 *         message:
 *           type: string
 *           minLength: 5
 *           maxLength: 1000
 *           description: The notification message content
 *           example: "System will be under maintenance from 2 AM to 4 AM"
 *         type:
 *           type: string
 *           enum: [Warning, Info, Success, Error]
 *           description: The type of notification
 *           example: "Warning"
 *         priority:
 *           type: string
 *           enum: [High, Medium, Low]
 *           description: The priority level
 *           example: "High"
 *         sendToAllUsers:
 *           type: boolean
 *           description: Whether to send to all users
 *           example: true
 *         targetUsers:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of user IDs to send notification to
 *         scheduledTime:
 *           type: string
 *           format: date-time
 *           description: When to send the notification (optional)
 *         status:
 *           type: string
 *           enum: [Draft, Scheduled, Sent, Failed, Cancelled]
 *           description: The notification status
 *           example: "Sent"
 *         category:
 *           type: string
 *           enum: [System, Marketing, Security, Updates, General]
 *           description: The notification category
 *           example: "System"
 *         actionButton:
 *           type: object
 *           properties:
 *             text:
 *               type: string
 *               maxLength: 50
 *               example: "View Details"
 *             url:
 *               type: string
 *               format: uri
 *               example: "https://example.com/details"
 *         icon:
 *           type: string
 *           description: Icon name for the notification
 *           example: "bell"
 *         isActive:
 *           type: boolean
 *           description: Whether the notification is active
 *           example: true
 *         expiresAt:
 *           type: string
 *           format: date-time
 *           description: When the notification expires
 *         deliveryStatus:
 *           type: object
 *           properties:
 *             total:
 *               type: number
 *               example: 100
 *             delivered:
 *               type: number
 *               example: 95
 *             failed:
 *               type: number
 *               example: 5
 *             pending:
 *               type: number
 *               example: 0
 *         readBy:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               user:
 *                 type: string
 *               readAt:
 *                 type: string
 *                 format: date-time
 *         metadata:
 *           type: object
 *           properties:
 *             platform:
 *               type: string
 *               enum: [web, mobile, both]
 *               example: "both"
 *             sound:
 *               type: boolean
 *               example: true
 *             vibration:
 *               type: boolean
 *               example: false
 *         createdBy:
 *           type: string
 *           description: ID of the user who created the notification
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *       example:
 *         title: "System Maintenance Alert"
 *         message: "System will be under maintenance from 2 AM to 4 AM"
 *         type: "Warning"
 *         priority: "High"
 *         sendToAllUsers: true
 *         category: "System"
 *         icon: "warning"
 * 
 *     NotificationInput:
 *       type: object
 *       required:
 *         - title
 *         - message
 *       properties:
 *         title:
 *           type: string
 *           minLength: 3
 *           maxLength: 200
 *           example: "System Maintenance Alert"
 *         message:
 *           type: string
 *           minLength: 5
 *           maxLength: 1000
 *           example: "System will be under maintenance from 2 AM to 4 AM"
 *         type:
 *           type: string
 *           enum: [Warning, Info, Success, Error]
 *           default: "Info"
 *           example: "Warning"
 *         priority:
 *           type: string
 *           enum: [High, Medium, Low]
 *           default: "Medium"
 *           example: "High"
 *         sendToAllUsers:
 *           type: boolean
 *           default: false
 *           example: true
 *         targetUsers:
 *           type: array
 *           items:
 *             type: string
 *           description: Required if sendToAllUsers is false
 *         scheduledTime:
 *           type: string
 *           format: date-time
 *           description: Leave empty for immediate sending
 *         category:
 *           type: string
 *           enum: [System, Marketing, Security, Updates, General]
 *           default: "General"
 *           example: "System"
 *         actionButton:
 *           type: object
 *           properties:
 *             text:
 *               type: string
 *               maxLength: 50
 *               example: "View Details"
 *             url:
 *               type: string
 *               format: uri
 *               example: "https://example.com/details"
 *         icon:
 *           type: string
 *           default: "bell"
 *           example: "warning"
 *         expiresAt:
 *           type: string
 *           format: date-time
 *           description: When the notification should expire
 *         metadata:
 *           type: object
 *           properties:
 *             platform:
 *               type: string
 *               enum: [web, mobile, both]
 *               default: "both"
 *             sound:
 *               type: boolean
 *               default: true
 *             vibration:
 *               type: boolean
 *               default: false
 * 
 *   securitySchemes:
 *     BearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: Notification management API endpoints
 */

/**
 * @swagger
 * /api/notifications:
 *   post:
 *     summary: Create a new notification
 *     tags: [Notifications]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NotificationInput'
 *     responses:
 *       201:
 *         description: Notification created successfully
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
 *                   example: "Notification created successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Notification'
 *       400:
 *         description: Bad request - validation error
 *       401:
 *         description: Unauthorized - invalid token
 *       500:
 *         description: Internal server error
 */
router.post('/', authMiddleware, createNotification);

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Get all notifications with filters and pagination
 *     tags: [Notifications]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of items per page
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [Warning, Info, Success, Error]
 *         description: Filter by notification type
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [High, Medium, Low]
 *         description: Filter by priority level
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Draft, Scheduled, Sent, Failed, Cancelled]
 *         description: Filter by notification status
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [System, Marketing, Security, Updates, General]
 *         description: Filter by category
 *       - in: query
 *         name: sendToAllUsers
 *         schema:
 *           type: boolean
 *         description: Filter by send to all users flag
 *       - in: query
 *         name: createdBy
 *         schema:
 *           type: string
 *         description: Filter by creator user ID
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in title and message
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
 *     responses:
 *       200:
 *         description: Notifications retrieved successfully
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
 *                   example: "Notifications retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     notifications:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Notification'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         currentPage:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *                         totalItems:
 *                           type: integer
 *                         itemsPerPage:
 *                           type: integer
 *                         hasNextPage:
 *                           type: boolean
 *                         hasPreviousPage:
 *                           type: boolean
 *       401:
 *         description: Unauthorized - invalid token
 *       500:
 *         description: Internal server error
 */
router.get('/', authMiddleware, getAllNotifications);

/**
 * @swagger
 * /api/notifications/user:
 *   get:
 *     summary: Get notifications for the current user
 *     tags: [Notifications]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of items per page
 *       - in: query
 *         name: unreadOnly
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Show only unread notifications
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [Warning, Info, Success, Error]
 *         description: Filter by notification type
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [High, Medium, Low]
 *         description: Filter by priority level
 *     responses:
 *       200:
 *         description: User notifications retrieved successfully
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
 *                   example: "User notifications retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     notifications:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Notification'
 *                     unreadCount:
 *                       type: integer
 *                       example: 5
 *                     pagination:
 *                       type: object
 *       401:
 *         description: Unauthorized - invalid token
 *       500:
 *         description: Internal server error
 */
router.get('/user', authMiddleware, getUserNotifications);

/**
 * @swagger
 * /api/notifications/stats:
 *   get:
 *     summary: Get notification statistics
 *     tags: [Notifications]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [7d, 30d, 90d]
 *           default: 30d
 *         description: Time period for statistics
 *       - in: query
 *         name: createdBy
 *         schema:
 *           type: string
 *         description: Filter by creator user ID
 *     responses:
 *       200:
 *         description: Notification statistics retrieved successfully
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
 *                   example: "Notification statistics retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     overview:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: number
 *                         sent:
 *                           type: number
 *                         scheduled:
 *                           type: number
 *                         draft:
 *                           type: number
 *                         failed:
 *                           type: number
 *                         highPriority:
 *                           type: number
 *                         totalDelivered:
 *                           type: number
 *                         totalFailed:
 *                           type: number
 *                         totalReads:
 *                           type: number
 *                     byType:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           count:
 *                             type: number
 *                     byPriority:
 *                       type: array
 *                       items:
 *                         type: object
 *                     byCategory:
 *                       type: array
 *                       items:
 *                         type: object
 *                     period:
 *                       type: string
 *       401:
 *         description: Unauthorized - invalid token
 *       500:
 *         description: Internal server error
 */
router.get('/stats', authMiddleware, getNotificationStats);

/**
 * @swagger
 * /api/notifications/scheduled:
 *   get:
 *     summary: Get all scheduled notifications
 *     tags: [Notifications]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *     responses:
 *       200:
 *         description: Scheduled notifications retrieved successfully
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
 *                 data:
 *                   type: object
 *                   properties:
 *                     notifications:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Notification'
 *                     pagination:
 *                       type: object
 *       401:
 *         description: Unauthorized - invalid token
 *       500:
 *         description: Internal server error
 */
router.get('/scheduled', authMiddleware, getScheduledNotifications);

/**
 * @swagger
 * /api/notifications/{id}:
 *   get:
 *     summary: Get a notification by ID
 *     tags: [Notifications]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Notification retrieved successfully
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
 *                   example: "Notification retrieved successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Notification'
 *       400:
 *         description: Bad request - invalid ID
 *       401:
 *         description: Unauthorized - invalid token
 *       404:
 *         description: Notification not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id', authMiddleware, getNotificationById);

/**
 * @swagger
 * /api/notifications/{id}:
 *   put:
 *     summary: Update a notification
 *     tags: [Notifications]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Notification ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NotificationInput'
 *     responses:
 *       200:
 *         description: Notification updated successfully
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
 *                   example: "Notification updated successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Notification'
 *       400:
 *         description: Bad request - validation error
 *       401:
 *         description: Unauthorized - invalid token
 *       404:
 *         description: Notification not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id', authMiddleware, updateNotification);

/**
 * @swagger
 * /api/notifications/{id}:
 *   delete:
 *     summary: Delete a notification
 *     tags: [Notifications]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Notification deleted successfully
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
 *                   example: "Notification deleted successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Notification'
 *       400:
 *         description: Bad request - invalid ID
 *       401:
 *         description: Unauthorized - invalid token
 *       404:
 *         description: Notification not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', authMiddleware, deleteNotification);

/**
 * @swagger
 * /api/notifications/{id}/read:
 *   patch:
 *     summary: Mark a notification as read
 *     tags: [Notifications]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Notification marked as read
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
 *                   example: "Notification marked as read"
 *                 data:
 *                   $ref: '#/components/schemas/Notification'
 *       400:
 *         description: Bad request - invalid ID
 *       401:
 *         description: Unauthorized - invalid token
 *       404:
 *         description: Notification not found
 *       500:
 *         description: Internal server error
 */
router.patch('/:id/read', authMiddleware, markAsRead);

/**
 * @swagger
 * /api/notifications/read-all:
 *   patch:
 *     summary: Mark all notifications as read for current user
 *     tags: [Notifications]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read
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
 *                   example: "5 notifications marked as read"
 *                 data:
 *                   type: object
 *                   properties:
 *                     markedCount:
 *                       type: integer
 *                       example: 5
 *       401:
 *         description: Unauthorized - invalid token
 *       500:
 *         description: Internal server error
 */
router.patch('/read-all', authMiddleware, markAllAsRead);

/**
 * @swagger
 * /api/notifications/{id}/send:
 *   post:
 *     summary: Send a notification immediately
 *     tags: [Notifications]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Notification sent successfully
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
 *                   example: "Notification sent successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Notification'
 *       400:
 *         description: Bad request - invalid ID or already sent
 *       401:
 *         description: Unauthorized - invalid token
 *       404:
 *         description: Notification not found
 *       500:
 *         description: Internal server error
 */
router.post('/:id/send', authMiddleware, sendImmediateNotification);

/**
 * @swagger
 * /api/notifications/{id}/cancel:
 *   patch:
 *     summary: Cancel a scheduled notification
 *     tags: [Notifications]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Scheduled notification cancelled successfully
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
 *                   example: "Scheduled notification cancelled successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Notification'
 *       400:
 *         description: Bad request - invalid ID or not scheduled
 *       401:
 *         description: Unauthorized - invalid token
 *       404:
 *         description: Notification not found
 *       500:
 *         description: Internal server error
 */
router.patch('/:id/cancel', authMiddleware, cancelScheduledNotification);

module.exports = router;
