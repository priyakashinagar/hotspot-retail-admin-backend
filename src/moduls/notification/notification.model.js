const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Notification title is required'],
        trim: true,
        minlength: [3, 'Title must be at least 3 characters'],
        maxlength: [200, 'Title cannot exceed 200 characters']
    },
    message: {
        type: String,
        required: [true, 'Notification message is required'],
        trim: true,
        minlength: [5, 'Message must be at least 5 characters'],
        maxlength: [1000, 'Message cannot exceed 1000 characters']
    },
    type: {
        type: String,
        required: [true, 'Notification type is required'],
        enum: {
            values: ['Warning', 'Info', 'Success', 'Error'],
            message: 'Type must be Warning, Info, Success, or Error'
        },
        default: 'Info'
    },
    priority: {
        type: String,
        required: [true, 'Priority is required'],
        enum: {
            values: ['High', 'Medium', 'Low'],
            message: 'Priority must be High, Medium, or Low'
        },
        default: 'Medium'
    },
    sendToAllUsers: {
        type: Boolean,
        default: false
    },
    targetUsers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    scheduledTime: {
        type: Date,
        validate: {
            validator: function(value) {
                return !value || value > new Date();
            },
            message: 'Scheduled time must be in the future'
        }
    },
    status: {
        type: String,
        enum: {
            values: ['Draft', 'Scheduled', 'Sent', 'Failed', 'Cancelled'],
            message: 'Status must be Draft, Scheduled, Sent, Failed, or Cancelled'
        },
        default: 'Draft'
    },
    sentAt: {
        type: Date
    },
    deliveryStatus: {
        total: { type: Number, default: 0 },
        delivered: { type: Number, default: 0 },
        failed: { type: Number, default: 0 },
        pending: { type: Number, default: 0 }
    },
    readBy: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        readAt: {
            type: Date,
            default: Date.now
        }
    }],
    category: {
        type: String,
        enum: ['System', 'Marketing', 'Security', 'Updates', 'General'],
        default: 'General'
    },
    actionButton: {
        text: {
            type: String,
            maxlength: [50, 'Action button text cannot exceed 50 characters']
        },
        url: {
            type: String,
            validate: {
                validator: function(v) {
                    return !v || /^https?:\/\/.+/.test(v);
                },
                message: 'Action URL must be a valid HTTP/HTTPS URL'
            }
        }
    },
    icon: {
        type: String,
        default: 'bell'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    expiresAt: {
        type: Date
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    metadata: {
        platform: {
            type: String,
            enum: ['web', 'mobile', 'both'],
            default: 'both'
        },
        sound: {
            type: Boolean,
            default: true
        },
        vibration: {
            type: Boolean,
            default: false
        }
    }
}, {
    timestamps: true,
    versionKey: false
});

// Indexes for better performance
notificationSchema.index({ type: 1 });
notificationSchema.index({ priority: 1 });
notificationSchema.index({ status: 1 });
notificationSchema.index({ scheduledTime: 1 });
notificationSchema.index({ createdBy: 1 });
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ 'targetUsers': 1 });
notificationSchema.index({ sendToAllUsers: 1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Virtual for read count
notificationSchema.virtual('readCount').get(function() {
    return this.readBy ? this.readBy.length : 0;
});

// Virtual for read percentage
notificationSchema.virtual('readPercentage').get(function() {
    if (this.deliveryStatus.delivered === 0) return 0;
    return Math.round((this.readCount / this.deliveryStatus.delivered) * 100);
});

// Virtual for delivery success rate
notificationSchema.virtual('deliverySuccessRate').get(function() {
    if (this.deliveryStatus.total === 0) return 0;
    return Math.round((this.deliveryStatus.delivered / this.deliveryStatus.total) * 100);
});

// Pre-save middleware
notificationSchema.pre('save', function(next) {
    // If scheduled time is set and status is draft, change to scheduled
    if (this.scheduledTime && this.status === 'Draft') {
        this.status = 'Scheduled';
    }
    
    // If no scheduled time and status is draft, set to immediate send
    if (!this.scheduledTime && this.status === 'Draft') {
        this.status = 'Sent';
        this.sentAt = new Date();
    }
    
    next();
});

// Static method to get notifications for a specific user
notificationSchema.statics.getForUser = function(userId, options = {}) {
    const {
        page = 1,
        limit = 20,
        unreadOnly = false,
        type = null,
        priority = null
    } = options;

    const query = {
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
    };

    if (unreadOnly) {
        query['readBy.user'] = { $ne: userId };
    }

    if (type) query.type = type;
    if (priority) query.priority = priority;

    const skip = (page - 1) * limit;

    return this.find(query)
        .sort({ priority: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('createdBy', 'name email')
        .lean();
};

// Static method to mark notification as read
notificationSchema.statics.markAsRead = function(notificationId, userId) {
    return this.findByIdAndUpdate(
        notificationId,
        {
            $addToSet: {
                readBy: {
                    user: userId,
                    readAt: new Date()
                }
            }
        },
        { new: true }
    );
};

// Static method to get unread count for a user
notificationSchema.statics.getUnreadCount = function(userId) {
    return this.countDocuments({
        $or: [
            { sendToAllUsers: true },
            { targetUsers: userId }
        ],
        status: 'Sent',
        isActive: true,
        'readBy.user': { $ne: userId },
        $or: [
            { expiresAt: { $exists: false } },
            { expiresAt: null },
            { expiresAt: { $gt: new Date() } }
        ]
    });
};

// Static method to search notifications
notificationSchema.statics.searchNotifications = function(searchTerm, options = {}) {
    const {
        page = 1,
        limit = 20,
        type = null,
        priority = null,
        status = null,
        createdBy = null
    } = options;

    const query = {};
    
    if (searchTerm) {
        query.$or = [
            { title: { $regex: searchTerm, $options: 'i' } },
            { message: { $regex: searchTerm, $options: 'i' } }
        ];
    }
    
    if (type) query.type = type;
    if (priority) query.priority = priority;
    if (status) query.status = status;
    if (createdBy) query.createdBy = createdBy;

    const skip = (page - 1) * limit;

    return this.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('createdBy', 'name email')
        .populate('targetUsers', 'name email')
        .lean();
};

// Instance method to check if user has read the notification
notificationSchema.methods.isReadBy = function(userId) {
    return this.readBy.some(read => read.user.toString() === userId.toString());
};

// Instance method to format notification data
notificationSchema.methods.toJSON = function() {
    const notification = this.toObject();
    
    // Add virtual fields
    notification.readCount = this.readCount;
    notification.readPercentage = this.readPercentage;
    notification.deliverySuccessRate = this.deliverySuccessRate;
    
    return notification;
};

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
