const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    productName: {
        type: String,
        required: [true, 'Product name is required'],
        trim: true,
        minlength: [2, 'Product name must be at least 2 characters'],
        maxlength: [200, 'Product name cannot exceed 200 characters']
    },
    sku: {
        type: String,
        required: [true, 'SKU is required'],
        unique: true,
        trim: true,
        uppercase: true,
        match: [
            /^[A-Z0-9-_]{3,20}$/,
            'SKU must be 3-20 characters long and contain only uppercase letters, numbers, hyphens, and underscores'
        ]
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: [true, 'Category is required']
    },
    price: {
        type: Number,
        required: [true, 'Price is required'],
        min: [0, 'Price cannot be negative'],
        validate: {
            validator: function(value) {
                return value > 0;
            },
            message: 'Price must be greater than 0'
        }
    },
    salePrice: {
        type: Number,
        min: [0, 'Sale price cannot be negative'],
        validate: {
            validator: function(value) {
                // Sale price should be less than or equal to regular price
                return !value || value <= this.price;
            },
            message: 'Sale price cannot be greater than regular price'
        }
    },
    quantity: {
        type: Number,
        required: [true, 'Quantity is required'],
        min: [0, 'Quantity cannot be negative'],
        default: 0
    },
    description: {
        type: String,
        trim: true,
        maxlength: [2000, 'Description cannot exceed 2000 characters']
    },
    productImages: [{
        url: {
            type: String,
            required: true
        },
        altText: {
            type: String,
            default: ''
        },
        isPrimary: {
            type: Boolean,
            default: false
        }
    }],
    weight: {
        type: Number,
        min: [0, 'Weight cannot be negative'],
        validate: {
            validator: function(value) {
                return !value || value >= 0;
            },
            message: 'Weight must be a positive number'
        }
    },
    status: {
        type: String,
        enum: {
            values: ['Active', 'Inactive', 'Draft', 'Discontinued'],
            message: 'Status must be Active, Inactive, Draft, or Discontinued'
        },
        default: 'Active'
    },
    tags: [{
        type: String,
        trim: true,
        lowercase: true
    }],
    inStock: {
        type: Boolean,
        default: true
    },
    // Additional fields for better product management
    slug: {
        type: String,
        unique: true,
        lowercase: true
    },
    brand: {
        type: String,
        trim: true,
        maxlength: [100, 'Brand name cannot exceed 100 characters']
    },
    dimensions: {
        length: { type: Number, min: 0 },
        width: { type: Number, min: 0 },
        height: { type: Number, min: 0 },
        unit: { type: String, enum: ['cm', 'inch', 'mm'], default: 'cm' }
    },
    ratings: {
        average: { type: Number, min: 0, max: 5, default: 0 },
        count: { type: Number, min: 0, default: 0 }
    },
    viewCount: {
        type: Number,
        default: 0
    },
    salesCount: {
        type: Number,
        default: 0
    },
    lowStockThreshold: {
        type: Number,
        min: 0,
        default: 10
    },
    isLowStock: {
        type: Boolean,
        default: false
    },
    isFeatured: {
        type: Boolean,
        default: false
    },
    metaTitle: {
        type: String,
        maxlength: [60, 'Meta title cannot exceed 60 characters']
    },
    metaDescription: {
        type: String,
        maxlength: [160, 'Meta description cannot exceed 160 characters']
    }
}, {
    timestamps: true,
    versionKey: false
});

// Indexes for better performance
productSchema.index({ productName: 'text', description: 'text', tags: 'text' });
productSchema.index({ category: 1 });
productSchema.index({ status: 1 });
productSchema.index({ inStock: 1 });
productSchema.index({ price: 1 });
productSchema.index({ sku: 1 });
productSchema.index({ slug: 1 });
productSchema.index({ isFeatured: 1 });
productSchema.index({ createdAt: -1 });

// Virtual for current effective price (sale price if available, otherwise regular price)
productSchema.virtual('effectivePrice').get(function() {
    return this.salePrice && this.salePrice > 0 ? this.salePrice : this.price;
});

// Virtual for discount percentage
productSchema.virtual('discountPercentage').get(function() {
    if (this.salePrice && this.salePrice > 0 && this.price > this.salePrice) {
        return Math.round(((this.price - this.salePrice) / this.price) * 100);
    }
    return 0;
});

// Virtual for primary image
productSchema.virtual('primaryImage').get(function() {
    const primaryImg = this.productImages.find(img => img.isPrimary);
    return primaryImg || (this.productImages.length > 0 ? this.productImages[0] : null);
});

// Pre-save middleware to generate slug
productSchema.pre('save', function(next) {
    if (this.isModified('productName')) {
        this.slug = this.productName
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '') // Remove special characters
            .replace(/\s+/g, '-') // Replace spaces with hyphens
            .replace(/-+/g, '-'); // Replace multiple hyphens with single hyphen
        
        // Add SKU to make it unique if needed
        if (this.sku) {
            this.slug = `${this.slug}-${this.sku.toLowerCase()}`;
        }
    }
    next();
});

// Pre-save middleware to check low stock
productSchema.pre('save', function(next) {
    this.isLowStock = this.quantity <= this.lowStockThreshold;
    this.inStock = this.quantity > 0;
    next();
});

// Pre-save middleware to ensure only one primary image
productSchema.pre('save', function(next) {
    if (this.productImages && this.productImages.length > 0) {
        const primaryImages = this.productImages.filter(img => img.isPrimary);
        
        if (primaryImages.length === 0) {
            // If no primary image set, make the first one primary
            this.productImages[0].isPrimary = true;
        } else if (primaryImages.length > 1) {
            // If multiple primary images, keep only the first one as primary
            this.productImages.forEach((img, index) => {
                img.isPrimary = index === 0;
            });
        }
    }
    next();
});

// Static method to search products
productSchema.statics.searchProducts = function(searchTerm, options = {}) {
    const {
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        category = null,
        status = null,
        inStock = null,
        priceMin = null,
        priceMax = null,
        isFeatured = null,
        tags = null
    } = options;

    const query = {};
    
    if (searchTerm) {
        query.$or = [
            { productName: { $regex: searchTerm, $options: 'i' } },
            { description: { $regex: searchTerm, $options: 'i' } },
            { sku: { $regex: searchTerm, $options: 'i' } },
            { tags: { $in: [new RegExp(searchTerm, 'i')] } }
        ];
    }
    
    if (category) query.category = category;
    if (status) query.status = status;
    if (inStock !== null) query.inStock = inStock;
    if (isFeatured !== null) query.isFeatured = isFeatured;
    if (tags) query.tags = { $in: tags.split(',').map(tag => tag.trim()) };
    
    // Price range filter
    if (priceMin !== null || priceMax !== null) {
        query.$or = [
            ...(query.$or || []),
            {
                $and: [
                    priceMin !== null ? { price: { $gte: priceMin } } : {},
                    priceMax !== null ? { price: { $lte: priceMax } } : {}
                ].filter(condition => Object.keys(condition).length > 0)
            },
            {
                $and: [
                    priceMin !== null ? { salePrice: { $gte: priceMin } } : {},
                    priceMax !== null ? { salePrice: { $lte: priceMax } } : {},
                    { salePrice: { $gt: 0 } }
                ].filter(condition => Object.keys(condition).length > 0)
            }
        ];
    }

    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    return this.find(query)
        .populate('category', 'name slug')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean();
};

// Static method to get low stock products
productSchema.statics.getLowStockProducts = function() {
    return this.find({ isLowStock: true, status: 'Active' })
        .populate('category', 'name')
        .sort({ quantity: 1 });
};

// Instance method to update stock
productSchema.methods.updateStock = function(quantity, operation = 'set') {
    if (operation === 'add') {
        this.quantity += quantity;
    } else if (operation === 'subtract') {
        this.quantity = Math.max(0, this.quantity - quantity);
    } else {
        this.quantity = Math.max(0, quantity);
    }
    
    this.isLowStock = this.quantity <= this.lowStockThreshold;
    this.inStock = this.quantity > 0;
    
    return this.save();
};

// Instance method to increment view count
productSchema.methods.incrementViewCount = function() {
    this.viewCount += 1;
    return this.save();
};

// Instance method to format product data for API response
productSchema.methods.toJSON = function() {
    const product = this.toObject();
    
    // Add virtual fields
    product.effectivePrice = this.effectivePrice;
    product.discountPercentage = this.discountPercentage;
    product.primaryImage = this.primaryImage;
    
    return product;
};

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
