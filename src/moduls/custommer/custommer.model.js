const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: [true, 'Full name is required'],
        trim: true,
        minlength: [2, 'Full name must be at least 2 characters'],
        maxlength: [100, 'Full name cannot exceed 100 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            'Please provide a valid email address'
        ]
    },
    mobileNumber: {
        type: String,
        required: [true, 'Mobile number is required'],
        unique: true,
        trim: true,
        match: [
            /^[+]?[\d\s\-()]{10,15}$/,
            'Please provide a valid mobile number'
        ]
    },
    gender: {
        type: String,
        required: [true, 'Gender is required'],
        enum: {
            values: ['Male', 'Female', 'Other'],
            message: 'Gender must be Male, Female, or Other'
        }
    },
    address: {
        type: String,
        required: [true, 'Address is required'],
        trim: true,
        maxlength: [500, 'Address cannot exceed 500 characters']
    },
    city: {
        type: String,
        required: [true, 'City is required'],
        trim: true,
        maxlength: [100, 'City name cannot exceed 100 characters']
    },
    state: {
        type: String,
        required: [true, 'State is required'],
        trim: true,
        maxlength: [100, 'State name cannot exceed 100 characters']
    },
    pincode: {
        type: String,
        required: [true, 'Pincode is required'],
        trim: true,
        match: [
            /^[0-9]{6}$/,
            'Please provide a valid 6-digit pincode'
        ]
    },
    dateOfBirth: {
        type: Date,
        required: [true, 'Date of birth is required'],
        validate: {
            validator: function(value) {
                return value < new Date();
            },
            message: 'Date of birth must be in the past'
        }
    },
    membership: {
        type: String,
        required: [true, 'Membership type is required'],
        enum: {
            values: ['Regular', 'Premium', 'VIP', 'Gold', 'Silver'],
            message: 'Invalid membership type'
        },
        default: 'Regular'
    },
    notes: {
        type: String,
        trim: true,
        maxlength: [1000, 'Notes cannot exceed 1000 characters'],
        default: ''
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastVisit: {
        type: Date,
        default: null
    },
    totalPurchases: {
        type: Number,
        default: 0,
        min: 0
    },
    totalSpent: {
        type: Number,
        default: 0,
        min: 0
    }
}, {
    timestamps: true,
    versionKey: false
});

// Indexes for better performance
customerSchema.index({ email: 1 });
customerSchema.index({ mobileNumber: 1 });
customerSchema.index({ fullName: 'text', email: 'text' });
customerSchema.index({ city: 1, state: 1 });
customerSchema.index({ membership: 1 });
customerSchema.index({ isActive: 1 });

// Virtual for age calculation
customerSchema.virtual('age').get(function() {
    if (!this.dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(this.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    
    return age;
});

// Virtual for full address
customerSchema.virtual('fullAddress').get(function() {
    return `${this.address}, ${this.city}, ${this.state} - ${this.pincode}`;
});

// Pre-save middleware to format mobile number
customerSchema.pre('save', function(next) {
    if (this.mobileNumber) {
        // Remove all non-digit characters except +
        this.mobileNumber = this.mobileNumber.replace(/[^\d+]/g, '');
        
        // If it starts with +91, keep it; otherwise add +91 if it's 10 digits
        if (!this.mobileNumber.startsWith('+91') && this.mobileNumber.length === 10) {
            this.mobileNumber = '+91' + this.mobileNumber;
        }
    }
    next();
});

// Static method to search customers
customerSchema.statics.searchCustomers = function(searchTerm, options = {}) {
    const {
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        membership = null,
        isActive = null,
        city = null,
        state = null
    } = options;

    const query = {};
    
    if (searchTerm) {
        query.$or = [
            { fullName: { $regex: searchTerm, $options: 'i' } },
            { email: { $regex: searchTerm, $options: 'i' } },
            { mobileNumber: { $regex: searchTerm, $options: 'i' } }
        ];
    }
    
    if (membership) query.membership = membership;
    if (isActive !== null) query.isActive = isActive;
    if (city) query.city = { $regex: city, $options: 'i' };
    if (state) query.state = { $regex: state, $options: 'i' };

    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    return this.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean();
};

// Instance method to format customer data
customerSchema.methods.toJSON = function() {
    const customer = this.toObject();
    
    // Add virtual fields
    customer.age = this.age;
    customer.fullAddress = this.fullAddress;
    
    return customer;
};

const Customer = mongoose.model('Customer', customerSchema);

module.exports = Customer;
