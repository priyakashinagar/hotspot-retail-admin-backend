const mongoose = require('mongoose');

// Schema for individual order items
const orderItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: [true, 'Product is required']
    },
    productName: {
        type: String,
        required: [true, 'Product name is required'],
        trim: true
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: [true, 'Category is required']
    },
    unitPrice: {
        type: Number,
        required: [true, 'Unit price is required'],
        min: [0, 'Unit price cannot be negative']
    },
    quantity: {
        type: Number,
        required: [true, 'Quantity is required'],
        min: [1, 'Quantity must be at least 1']
    },
    totalPrice: {
        type: Number,
        required: [true, 'Total price is required'],
        min: [0, 'Total price cannot be negative']
    }
}, {
    _id: true,
    timestamps: false
});

// Main purchase order schema
const purchaseOrderSchema = new mongoose.Schema({
    orderNumber: {
        type: String,
        required: [true, 'Order number is required'],
        unique: true,
        trim: true,
        uppercase: true
    },
    vendor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Supplier',
        required: [true, 'Vendor is required']
    },
    purchaseDate: {
        type: Date,
        required: [true, 'Purchase date is required'],
        default: Date.now
    },
    expectedDelivery: {
        type: Date,
        required: [true, 'Expected delivery date is required'],
        validate: {
            validator: function(value) {
                return value >= this.purchaseDate;
            },
            message: 'Expected delivery date must be after purchase date'
        }
    },
    paymentTerms: {
        type: String,
        required: [true, 'Payment terms are required'],
        enum: {
            values: ['Net 30 Days', 'Net 15 Days', 'Net 7 Days', 'Immediate', 'COD', 'Advance Payment'],
            message: 'Invalid payment terms'
        },
        default: 'Net 30 Days'
    },
    priority: {
        type: String,
        required: [true, 'Priority is required'],
        enum: {
            values: ['Low', 'Medium', 'High', 'Urgent'],
            message: 'Invalid priority level'
        },
        default: 'Medium'
    },
    status: {
        type: String,
        required: [true, 'Status is required'],
        enum: {
            values: ['Draft', 'Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled', 'Returned'],
            message: 'Invalid order status'
        },
        default: 'Draft'
    },
    orderItems: {
        type: [orderItemSchema],
        required: [true, 'Order items are required'],
        validate: {
            validator: function(items) {
                return items && items.length > 0;
            },
            message: 'At least one order item is required'
        }
    },
    subtotal: {
        type: Number,
        required: [true, 'Subtotal is required'],
        min: [0, 'Subtotal cannot be negative'],
        default: 0
    },
    taxRate: {
        type: Number,
        min: [0, 'Tax rate cannot be negative'],
        max: [100, 'Tax rate cannot exceed 100%'],
        default: 18 // Default GST rate in India
    },
    taxAmount: {
        type: Number,
        min: [0, 'Tax amount cannot be negative'],
        default: 0
    },
    shippingCost: {
        type: Number,
        min: [0, 'Shipping cost cannot be negative'],
        default: 0
    },
    discount: {
        type: Number,
        min: [0, 'Discount cannot be negative'],
        default: 0
    },
    totalAmount: {
        type: Number,
        required: [true, 'Total amount is required'],
        min: [0, 'Total amount cannot be negative']
    },
    notes: {
        type: String,
        trim: true,
        maxlength: [1000, 'Notes cannot exceed 1000 characters']
    },
    isRecurring: {
        type: Boolean,
        default: false
    },
    recurringFrequency: {
        type: String,
        enum: {
            values: ['Weekly', 'Monthly', 'Quarterly', 'Yearly'],
            message: 'Invalid recurring frequency'
        }
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Created by user is required']
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    deletedAt: {
        type: Date
    },
    deliveredAt: {
        type: Date
    },
    cancelledAt: {
        type: Date
    },
    cancellationReason: {
        type: String,
        trim: true,
        maxlength: [500, 'Cancellation reason cannot exceed 500 characters']
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Pre-save middleware to calculate totals
purchaseOrderSchema.pre('save', function(next) {
    // Calculate subtotal from order items
    this.subtotal = this.orderItems.reduce((total, item) => {
        return total + (item.unitPrice * item.quantity);
    }, 0);

    // Calculate tax amount
    this.taxAmount = (this.subtotal * this.taxRate) / 100;

    // Calculate total amount
    this.totalAmount = this.subtotal + this.taxAmount + this.shippingCost - this.discount;

    // Ensure each order item's total price is calculated correctly
    this.orderItems.forEach(item => {
        item.totalPrice = item.unitPrice * item.quantity;
    });

    next();
});

// Generate unique order number
purchaseOrderSchema.pre('save', async function(next) {
    if (this.isNew && !this.orderNumber) {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        
        // Find the latest order for this month
        const latestOrder = await this.constructor.findOne({
            orderNumber: new RegExp(`^PO-${year}${month}-`)
        }).sort({ orderNumber: -1 });

        let sequence = 1;
        if (latestOrder) {
            const lastSequence = parseInt(latestOrder.orderNumber.split('-')[2]);
            sequence = lastSequence + 1;
        }

        this.orderNumber = `PO-${year}${month}-${String(sequence).padStart(3, '0')}`;
    }
    next();
});

// Virtual for order age in days
purchaseOrderSchema.virtual('orderAge').get(function() {
    const now = new Date();
    const diffTime = Math.abs(now - this.purchaseDate);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for delivery status
purchaseOrderSchema.virtual('deliveryStatus').get(function() {
    const now = new Date();
    if (this.status === 'Delivered') return 'Delivered';
    if (this.status === 'Cancelled') return 'Cancelled';
    
    if (now > this.expectedDelivery) {
        return 'Overdue';
    } else {
        const daysLeft = Math.ceil((this.expectedDelivery - now) / (1000 * 60 * 60 * 24));
        if (daysLeft <= 3) return 'Due Soon';
        return 'On Time';
    }
});

// Index for better query performance
purchaseOrderSchema.index({ orderNumber: 1 });
purchaseOrderSchema.index({ vendor: 1 });
purchaseOrderSchema.index({ status: 1 });
purchaseOrderSchema.index({ purchaseDate: -1 });
purchaseOrderSchema.index({ createdAt: -1 });
purchaseOrderSchema.index({ isDeleted: 1 });

// Static method to get order statistics
purchaseOrderSchema.statics.getOrderStats = function() {
    return this.aggregate([
        { $match: { isDeleted: false } },
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
                totalAmount: { $sum: '$totalAmount' }
            }
        }
    ]);
};

module.exports = mongoose.model('PurchaseOrder', purchaseOrderSchema);
