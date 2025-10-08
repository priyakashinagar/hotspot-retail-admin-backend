const mongoose = require('mongoose');

const paymentLinkSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Payment link title is required'],
        trim: true,
        minlength: [3, 'Title must be at least 3 characters'],
        maxlength: [200, 'Title cannot exceed 200 characters']
    },
    amount: {
        type: Number,
        required: [true, 'Amount is required'],
        min: [0.01, 'Amount must be greater than 0'],
        validate: {
            validator: function(value) {
                return value > 0;
            },
            message: 'Amount must be a positive number'
        }
    },
    currency: {
        type: String,
        required: [true, 'Currency is required'],
        enum: {
            values: ['INR', 'USD', 'EUR', 'GBP'],
            message: 'Currency must be INR, USD, EUR, or GBP'
        },
        default: 'INR'
    },
    customerName: {
        type: String,
        trim: true,
        maxlength: [100, 'Customer name cannot exceed 100 characters']
    },
    customerEmail: {
        type: String,
        required: [true, 'Customer email is required'],
        lowercase: true,
        trim: true,
        match: [
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            'Please provide a valid email address'
        ]
    },
    description: {
        type: String,
        trim: true,
        maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    expiryDate: {
        type: Date,
        validate: {
            validator: function(value) {
                return !value || value > new Date();
            },
            message: 'Expiry date must be in the future'
        }
    },
    allowPartialPayment: {
        type: Boolean,
        default: false
    },
    sendEmailNotification: {
        type: Boolean,
        default: true
    },
    sendSmsNotification: {
        type: Boolean,
        default: true
    },
    paymentLinkId: {
        type: String,
        unique: true,
        required: true
    },
    shortUrl: {
        type: String,
        unique: true
    },
    status: {
        type: String,
        enum: {
            values: ['Active', 'Expired', 'Paid', 'Cancelled', 'Partially Paid'],
            message: 'Status must be Active, Expired, Paid, Cancelled, or Partially Paid'
        },
        default: 'Active'
    },
    paymentStatus: {
        type: String,
        enum: {
            values: ['Pending', 'Completed', 'Failed', 'Partially Paid', 'Refunded'],
            message: 'Payment status must be Pending, Completed, Failed, Partially Paid, or Refunded'
        },
        default: 'Pending'
    },
    paidAmount: {
        type: Number,
        default: 0,
        min: 0
    },
    remainingAmount: {
        type: Number,
        default: 0,
        min: 0
    },
    paymentGateway: {
        type: String,
        enum: ['Razorpay', 'Stripe', 'PayPal', 'Paytm'],
        default: 'Razorpay'
    },
    gatewayPaymentId: {
        type: String
    },
    gatewayOrderId: {
        type: String
    },
    transactionFee: {
        type: Number,
        default: 0,
        min: 0
    },
    paymentHistory: [{
        amount: {
            type: Number,
            required: true
        },
        paymentDate: {
            type: Date,
            default: Date.now
        },
        transactionId: {
            type: String,
            required: true
        },
        paymentMethod: {
            type: String,
            enum: ['Card', 'UPI', 'Net Banking', 'Wallet']
        },
        status: {
            type: String,
            enum: ['Success', 'Failed', 'Pending'],
            default: 'Pending'
        }
    }],
    clickCount: {
        type: Number,
        default: 0
    },
    lastAccessedAt: {
        type: Date
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    metadata: {
        type: Map,
        of: String
    }
}, {
    timestamps: true,
    versionKey: false
});

// Indexes for better performance
paymentLinkSchema.index({ paymentLinkId: 1 });
paymentLinkSchema.index({ customerEmail: 1 });
paymentLinkSchema.index({ status: 1 });
paymentLinkSchema.index({ paymentStatus: 1 });
paymentLinkSchema.index({ expiryDate: 1 });
paymentLinkSchema.index({ createdBy: 1 });
paymentLinkSchema.index({ createdAt: 1 });

// Virtual for remaining amount calculation
paymentLinkSchema.virtual('calculatedRemainingAmount').get(function() {
    return Math.max(0, this.amount - this.paidAmount);
});

// Virtual for payment completion percentage
paymentLinkSchema.virtual('paymentPercentage').get(function() {
    if (this.amount === 0) return 0;
    return Math.min(100, (this.paidAmount / this.amount) * 100);
});

// Virtual for payment link URL
paymentLinkSchema.virtual('paymentUrl').get(function() {
    const baseUrl = process.env.PAYMENT_BASE_URL || 'https://pay.yourapp.com';
    return `${baseUrl}/${this.paymentLinkId}`;
});

// Pre-save middleware to generate payment link ID
paymentLinkSchema.pre('save', function(next) {
    if (!this.paymentLinkId) {
        this.paymentLinkId = generatePaymentLinkId();
    }
    
    // Update remaining amount
    this.remainingAmount = Math.max(0, this.amount - this.paidAmount);
    
    // Update status based on payment
    if (this.paidAmount >= this.amount) {
        this.status = 'Paid';
        this.paymentStatus = 'Completed';
    } else if (this.paidAmount > 0) {
        this.status = 'Partially Paid';
        this.paymentStatus = 'Partially Paid';
    }
    
    // Check expiry
    if (this.expiryDate && this.expiryDate < new Date() && this.status === 'Active') {
        this.status = 'Expired';
    }
    
    next();
});

// Static method to generate unique payment link ID
function generatePaymentLinkId() {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 8);
    return `PL_${timestamp}_${randomStr}`.toUpperCase();
}

// Static method to search payment links
paymentLinkSchema.statics.searchPaymentLinks = function(searchTerm, options = {}) {
    const {
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        status = null,
        paymentStatus = null,
        createdBy = null
    } = options;

    const query = {};
    
    if (searchTerm) {
        query.$or = [
            { title: { $regex: searchTerm, $options: 'i' } },
            { customerName: { $regex: searchTerm, $options: 'i' } },
            { customerEmail: { $regex: searchTerm, $options: 'i' } },
            { paymentLinkId: { $regex: searchTerm, $options: 'i' } }
        ];
    }
    
    if (status) query.status = status;
    if (paymentStatus) query.paymentStatus = paymentStatus;
    if (createdBy) query.createdBy = createdBy;

    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    return this.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('createdBy', 'name email')
        .lean();
};

// Instance method to format payment link data
paymentLinkSchema.methods.toJSON = function() {
    const paymentLink = this.toObject();
    
    // Add virtual fields
    paymentLink.calculatedRemainingAmount = this.calculatedRemainingAmount;
    paymentLink.paymentPercentage = this.paymentPercentage;
    paymentLink.paymentUrl = this.paymentUrl;
    
    return paymentLink;
};

const PaymentLink = mongoose.model('PaymentLink', paymentLinkSchema);

module.exports = PaymentLink;
