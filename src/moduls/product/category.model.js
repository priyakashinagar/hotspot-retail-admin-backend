const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Category name is required'],
        trim: true,
        unique: true,
        maxlength: [100, 'Category name cannot exceed 100 characters']
    },
    slug: {
        type: String,
        unique: true,
        lowercase: true,
        trim: true
    },
    description: {
        type: String,
        trim: true,
        maxlength: [500, 'Description cannot exceed 500 characters']
    },
    parentCategory: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        default: null
    },
    image: {
        type: String,
        default: null
    },
    status: {
        type: String,
        enum: ['Active', 'Inactive'],
        default: 'Active'
    },
    level: {
        type: Number,
        default: 0
    },
    path: {
        type: String,
        default: ''
    },
    sortOrder: {
        type: Number,
        default: 0
    },
    productCount: {
        type: Number,
        default: 0
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Create slug from name before saving
categorySchema.pre('save', function(next) {
    if (this.isModified('name')) {
        this.slug = this.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
    }
    next();
});

// Calculate level and path based on parent category
categorySchema.pre('save', async function(next) {
    if (this.isModified('parentCategory') || this.isNew) {
        if (this.parentCategory) {
            const parent = await this.constructor.findById(this.parentCategory);
            if (parent) {
                this.level = parent.level + 1;
                this.path = parent.path ? `${parent.path},${parent._id}` : parent._id.toString();
            }
        } else {
            this.level = 0;
            this.path = '';
        }
    }
    next();
});

// Instance method to get children categories
categorySchema.methods.getChildren = function() {
    return this.constructor.find({ 
        parentCategory: this._id,
        isDeleted: false 
    });
};

// Instance method to get all descendants
categorySchema.methods.getAllDescendants = function() {
    const pathRegex = new RegExp(`(^|,)${this._id}(,|$)`);
    return this.constructor.find({ 
        path: pathRegex,
        isDeleted: false 
    });
};

// Static method to get category tree
categorySchema.statics.getCategoryTree = function() {
    return this.aggregate([
        { $match: { isDeleted: false } },
        { $sort: { level: 1, sortOrder: 1, name: 1 } },
        {
            $lookup: {
                from: 'categories',
                localField: 'parentCategory',
                foreignField: '_id',
                as: 'parent'
            }
        },
        {
            $addFields: {
                parent: { $arrayElemAt: ['$parent', 0] }
            }
        }
    ]);
};

// Static method to build nested tree structure
categorySchema.statics.buildNestedTree = async function(parentId = null) {
    const categories = await this.find({ 
        parentCategory: parentId,
        isDeleted: false 
    }).sort({ sortOrder: 1, name: 1 });

    const tree = [];
    for (let category of categories) {
        const categoryObj = category.toObject();
        categoryObj.children = await this.buildNestedTree(category._id);
        tree.push(categoryObj);
    }
    return tree;
};

// Index for better performance
categorySchema.index({ parentCategory: 1, status: 1 });
categorySchema.index({ name: 'text', description: 'text' });

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;
