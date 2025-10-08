const Notification = require('./notification.model');
const mongoose = require('mongoose');

// Create a new notification
const createNotification = async (req, res) => {
    try {
        const {
            title,
            message,
            type = 'Info',
            priority = 'Medium',
            sendToAllUsers = false,
            targetUsers = [],
            scheduledTime,
            category = 'General',
            actionButton,
            icon = 'bell',
            expiresAt,
            metadata = {}
        } = req.body;

        // Validate required fields
        if (!title || !message) {
            return res.status(400).json({
                success: false,
                message: 'Title and message are required'
            });
        }

        // Validate if targetUsers is provided when sendToAllUsers is false
        if (!sendToAllUsers && (!targetUsers || targetUsers.length === 0)) {
            return res.status(400).json({
                success: false,
                message: 'Target users are required when not sending to all users'
            });
        }

        // Create notification object
        const notificationData = {
            title,
            message,
            type,
            priority,
            sendToAllUsers,
            targetUsers: sendToAllUsers ? [] : targetUsers,
            scheduledTime: scheduledTime ? new Date(scheduledTime) : null,
            category,
            actionButton,
            icon,
            expiresAt: expiresAt ? new Date(expiresAt) : null,
            createdBy: req.user.id,
            metadata: {
                platform: metadata.platform || 'both',
                sound: metadata.sound !== undefined ? metadata.sound : true,
                vibration: metadata.vibration !== undefined ? metadata.vibration : false
            }
        };

        const notification = new Notification(notificationData);
        await notification.save();

        // Populate createdBy field
        await notification.populate('createdBy', 'name email');

        res.status(201).json({
            success: true,
            message: 'Notification created successfully',
            data: notification
        });

    } catch (error) {
        console.error('Create notification error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create notification',
            error: error.message
        });
    }
};

// Get all notifications with filters and pagination
const getAllNotifications = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            type,
            priority,
            status,
            category,
            sendToAllUsers,
            createdBy,
            search,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        // Build query
        const query = {};
        
        if (type) query.type = type;
        if (priority) query.priority = priority;
        if (status) query.status = status;
        if (category) query.category = category;
        if (sendToAllUsers !== undefined) query.sendToAllUsers = sendToAllUsers === 'true';
        if (createdBy) query.createdBy = createdBy;
        
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { message: { $regex: search, $options: 'i' } }
            ];
        }

        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

        // Get notifications
        const notifications = await Notification.find(query)
            .sort(sortOptions)
            .skip(skip)
            .limit(parseInt(limit))
            .populate('createdBy', 'name email')
            .populate('targetUsers', 'name email')
            .lean();

        // Get total count
        const total = await Notification.countDocuments(query);

        res.status(200).json({
            success: true,
            message: 'Notifications retrieved successfully',
            data: {
                notifications,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / parseInt(limit)),
                    totalItems: total,
                    itemsPerPage: parseInt(limit),
                    hasNextPage: skip + parseInt(limit) < total,
                    hasPreviousPage: parseInt(page) > 1
                }
            }
        });

    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve notifications',
            error: error.message
        });
    }
};

// Get notification by ID
const getNotificationById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid notification ID'
            });
        }

        const notification = await Notification.findById(id)
            .populate('createdBy', 'name email')
            .populate('targetUsers', 'name email')
            .populate('readBy.user', 'name email');

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Notification retrieved successfully',
            data: notification
        });

    } catch (error) {
        console.error('Get notification by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve notification',
            error: error.message
        });
    }
};

// Update notification
const updateNotification = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid notification ID'
            });
        }

        // Remove fields that shouldn't be updated
        delete updateData.createdBy;
        delete updateData.createdAt;
        delete updateData.readBy;
        delete updateData.deliveryStatus;

        // Parse dates if provided
        if (updateData.scheduledTime) {
            updateData.scheduledTime = new Date(updateData.scheduledTime);
        }
        if (updateData.expiresAt) {
            updateData.expiresAt = new Date(updateData.expiresAt);
        }

        const notification = await Notification.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        ).populate('createdBy', 'name email')
         .populate('targetUsers', 'name email');

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Notification updated successfully',
            data: notification
        });

    } catch (error) {
        console.error('Update notification error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update notification',
            error: error.message
        });
    }
};

// Delete notification
const deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid notification ID'
            });
        }

        const notification = await Notification.findByIdAndDelete(id);

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Notification deleted successfully',
            data: notification
        });

    } catch (error) {
        console.error('Delete notification error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete notification',
            error: error.message
        });
    }
};

// Get notifications for current user
const getUserNotifications = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            unreadOnly = false,
            type,
            priority
        } = req.query;

        const userId = req.user.id;
        const options = {
            page: parseInt(page),
            limit: parseInt(limit),
            unreadOnly: unreadOnly === 'true',
            type,
            priority
        };

        const notifications = await Notification.getForUser(userId, options);
        const total = await Notification.countDocuments({
            $or: [
                { sendToAllUsers: true },
                { targetUsers: userId }
            ],
            status: 'Sent',
            isActive: true,
            $or: [
                { expiresAt: { $exists: false } },
                { expiresAt: null },
                { expiresAt: { $gt: new Date() } }
            ]
        });

        const unreadCount = await Notification.getUnreadCount(userId);

        res.status(200).json({
            success: true,
            message: 'User notifications retrieved successfully',
            data: {
                notifications,
                unreadCount,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / parseInt(limit)),
                    totalItems: total,
                    itemsPerPage: parseInt(limit),
                    hasNextPage: parseInt(page) * parseInt(limit) < total,
                    hasPreviousPage: parseInt(page) > 1
                }
            }
        });

    } catch (error) {
        console.error('Get user notifications error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve user notifications',
            error: error.message
        });
    }
};

// Mark notification as read
const markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid notification ID'
            });
        }

        const notification = await Notification.markAsRead(id, userId);

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Notification marked as read',
            data: notification
        });

    } catch (error) {
        console.error('Mark as read error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to mark notification as read',
            error: error.message
        });
    }
};

// Mark all notifications as read for user
const markAllAsRead = async (req, res) => {
    try {
        const userId = req.user.id;

        // Find all unread notifications for this user
        const unreadNotifications = await Notification.find({
            $or: [
                { sendToAllUsers: true },
                { targetUsers: userId }
            ],
            status: 'Sent',
            isActive: true,
            'readBy.user': { $ne: userId }
        });

        // Mark all as read
        const updatePromises = unreadNotifications.map(notification => 
            Notification.markAsRead(notification._id, userId)
        );

        await Promise.all(updatePromises);

        res.status(200).json({
            success: true,
            message: `${unreadNotifications.length} notifications marked as read`,
            data: {
                markedCount: unreadNotifications.length
            }
        });

    } catch (error) {
        console.error('Mark all as read error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to mark all notifications as read',
            error: error.message
        });
    }
};

// Send immediate notification
const sendImmediateNotification = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid notification ID'
            });
        }

        const notification = await Notification.findById(id);

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        if (notification.status === 'Sent') {
            return res.status(400).json({
                success: false,
                message: 'Notification already sent'
            });
        }

        // Update notification status
        notification.status = 'Sent';
        notification.sentAt = new Date();
        notification.scheduledTime = null;

        // Calculate delivery status (mock implementation)
        let totalRecipients = 0;
        if (notification.sendToAllUsers) {
            // In real implementation, count all active users
            totalRecipients = 100; // Mock value
        } else {
            totalRecipients = notification.targetUsers.length;
        }

        notification.deliveryStatus = {
            total: totalRecipients,
            delivered: totalRecipients,
            failed: 0,
            pending: 0
        };

        await notification.save();

        res.status(200).json({
            success: true,
            message: 'Notification sent successfully',
            data: notification
        });

    } catch (error) {
        console.error('Send immediate notification error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send notification',
            error: error.message
        });
    }
};

// Get notification statistics
const getNotificationStats = async (req, res) => {
    try {
        const { period = '30d', createdBy } = req.query;

        // Calculate date range
        const now = new Date();
        let startDate;
        
        switch (period) {
            case '7d':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case '30d':
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            case '90d':
                startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                break;
            default:
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        }

        const matchQuery = {
            createdAt: { $gte: startDate }
        };

        if (createdBy) {
            matchQuery.createdBy = mongoose.Types.ObjectId(createdBy);
        }

        const stats = await Notification.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    sent: {
                        $sum: {
                            $cond: [{ $eq: ['$status', 'Sent'] }, 1, 0]
                        }
                    },
                    scheduled: {
                        $sum: {
                            $cond: [{ $eq: ['$status', 'Scheduled'] }, 1, 0]
                        }
                    },
                    draft: {
                        $sum: {
                            $cond: [{ $eq: ['$status', 'Draft'] }, 1, 0]
                        }
                    },
                    failed: {
                        $sum: {
                            $cond: [{ $eq: ['$status', 'Failed'] }, 1, 0]
                        }
                    },
                    highPriority: {
                        $sum: {
                            $cond: [{ $eq: ['$priority', 'High'] }, 1, 0]
                        }
                    },
                    totalDelivered: { $sum: '$deliveryStatus.delivered' },
                    totalFailed: { $sum: '$deliveryStatus.failed' },
                    totalReads: { $sum: { $size: '$readBy' } }
                }
            }
        ]);

        const typeStats = await Notification.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: '$type',
                    count: { $sum: 1 }
                }
            }
        ]);

        const priorityStats = await Notification.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: '$priority',
                    count: { $sum: 1 }
                }
            }
        ]);

        const categoryStats = await Notification.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: '$category',
                    count: { $sum: 1 }
                }
            }
        ]);

        res.status(200).json({
            success: true,
            message: 'Notification statistics retrieved successfully',
            data: {
                overview: stats[0] || {
                    total: 0,
                    sent: 0,
                    scheduled: 0,
                    draft: 0,
                    failed: 0,
                    highPriority: 0,
                    totalDelivered: 0,
                    totalFailed: 0,
                    totalReads: 0
                },
                byType: typeStats,
                byPriority: priorityStats,
                byCategory: categoryStats,
                period
            }
        });

    } catch (error) {
        console.error('Get notification stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve notification statistics',
            error: error.message
        });
    }
};

// Get scheduled notifications
const getScheduledNotifications = async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const notifications = await Notification.find({
            status: 'Scheduled',
            scheduledTime: { $gt: new Date() }
        })
        .sort({ scheduledTime: 1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('createdBy', 'name email')
        .populate('targetUsers', 'name email');

        const total = await Notification.countDocuments({
            status: 'Scheduled',
            scheduledTime: { $gt: new Date() }
        });

        res.status(200).json({
            success: true,
            message: 'Scheduled notifications retrieved successfully',
            data: {
                notifications,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / parseInt(limit)),
                    totalItems: total,
                    itemsPerPage: parseInt(limit),
                    hasNextPage: skip + parseInt(limit) < total,
                    hasPreviousPage: parseInt(page) > 1
                }
            }
        });

    } catch (error) {
        console.error('Get scheduled notifications error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve scheduled notifications',
            error: error.message
        });
    }
};

// Cancel scheduled notification
const cancelScheduledNotification = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid notification ID'
            });
        }

        const notification = await Notification.findById(id);

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        if (notification.status !== 'Scheduled') {
            return res.status(400).json({
                success: false,
                message: 'Only scheduled notifications can be cancelled'
            });
        }

        notification.status = 'Cancelled';
        notification.scheduledTime = null;
        await notification.save();

        res.status(200).json({
            success: true,
            message: 'Scheduled notification cancelled successfully',
            data: notification
        });

    } catch (error) {
        console.error('Cancel scheduled notification error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to cancel scheduled notification',
            error: error.message
        });
    }
};

module.exports = {
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
};
