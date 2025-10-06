const Category = require('./category.model');
const path = require('path');
const fs = require('fs');

// Response helper function
const sendResponse = (res, statusCode, success, message, data = null) => {
    return res.status(statusCode).json({
        success,
        message,
        data
    });
};

// Create new category
const createCategory = async (req, res) => {
    try {
        const { name, description, parentCategory, status, sortOrder } = req.body;

        // Validate required fields
        if (!name) {
            return sendResponse(res, 400, false, 'Category name is required');
        }

        // Check if category with same name already exists
        const existingCategory = await Category.findOne({ 
            name: name.trim(),
            isDeleted: false 
        });
        
        if (existingCategory) {
            return sendResponse(res, 409, false, 'Category with this name already exists');
        }

        // Validate parent category if provided
        if (parentCategory) {
            const parent = await Category.findById(parentCategory);
            if (!parent || parent.isDeleted) {
                return sendResponse(res, 404, false, 'Parent category not found');
            }
        }

        // Create category object
        const categoryData = {
            name: name.trim(),
            description: description?.trim(),
            parentCategory: parentCategory || null,
            status: status || 'Active',
            sortOrder: sortOrder || 0
        };

        // Handle image upload if present
        if (req.file) {
            categoryData.image = req.file.path;
        }

        const category = new Category(categoryData);
        await category.save();

        // Populate parent category for response
        await category.populate('parentCategory', 'name slug');

        return sendResponse(res, 201, true, 'Category created successfully', category);

    } catch (error) {
        console.error('Create category error:', error);
        
        // Handle validation errors
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            return sendResponse(res, 400, false, errors.join(', '));
        }

        // Handle duplicate key error
        if (error.code === 11000) {
            return sendResponse(res, 409, false, 'Category name or slug already exists');
        }

        return sendResponse(res, 500, false, 'Internal server error');
    }
};

// Get all categories with filtering and pagination
const getCategories = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            status,
            parentCategory,
            search,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        // Build filter object
        const filter = { isDeleted: false };

        if (status) {
            filter.status = status;
        }

        if (parentCategory) {
            filter.parentCategory = parentCategory === 'null' ? null : parentCategory;
        }

        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        // Calculate pagination
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        // Build sort object
        const sort = {};
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

        // Get categories with pagination
        const categories = await Category.find(filter)
            .populate('parentCategory', 'name slug')
            .sort(sort)
            .skip(skip)
            .limit(limitNum);

        // Get total count
        const total = await Category.countDocuments(filter);

        // Calculate pagination info
        const totalPages = Math.ceil(total / limitNum);
        const hasNextPage = pageNum < totalPages;
        const hasPrevPage = pageNum > 1;

        return sendResponse(res, 200, true, 'Categories retrieved successfully', {
            categories,
            pagination: {
                current: pageNum,
                total: totalPages,
                hasNext: hasNextPage,
                hasPrev: hasPrevPage,
                totalItems: total
            }
        });

    } catch (error) {
        console.error('Get categories error:', error);
        return sendResponse(res, 500, false, 'Internal server error');
    }
};

// Get category by ID
const getCategoryById = async (req, res) => {
    try {
        const { id } = req.params;

        const category = await Category.findOne({ 
            _id: id, 
            isDeleted: false 
        }).populate('parentCategory', 'name slug');

        if (!category) {
            return sendResponse(res, 404, false, 'Category not found');
        }

        // Get children categories
        const children = await category.getChildren();

        return sendResponse(res, 200, true, 'Category retrieved successfully', {
            ...category.toObject(),
            children
        });

    } catch (error) {
        console.error('Get category by ID error:', error);
        
        if (error.name === 'CastError') {
            return sendResponse(res, 400, false, 'Invalid category ID');
        }

        return sendResponse(res, 500, false, 'Internal server error');
    }
};

// Update category
const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, parentCategory, status, sortOrder } = req.body;

        const category = await Category.findOne({ 
            _id: id, 
            isDeleted: false 
        });

        if (!category) {
            return sendResponse(res, 404, false, 'Category not found');
        }

        // Check if name is being changed and if it already exists
        if (name && name.trim() !== category.name) {
            const existingCategory = await Category.findOne({ 
                name: name.trim(),
                _id: { $ne: id },
                isDeleted: false 
            });
            
            if (existingCategory) {
                return sendResponse(res, 409, false, 'Category with this name already exists');
            }
        }

        // Validate parent category if provided
        if (parentCategory && parentCategory !== category.parentCategory?.toString()) {
            // Prevent setting self as parent
            if (parentCategory === id) {
                return sendResponse(res, 400, false, 'Category cannot be its own parent');
            }

            // Prevent circular reference
            const wouldCreateCircle = await checkCircularReference(id, parentCategory);
            if (wouldCreateCircle) {
                return sendResponse(res, 400, false, 'This would create a circular reference');
            }

            const parent = await Category.findById(parentCategory);
            if (!parent || parent.isDeleted) {
                return sendResponse(res, 404, false, 'Parent category not found');
            }
        }

        // Update fields
        if (name) category.name = name.trim();
        if (description !== undefined) category.description = description?.trim();
        if (parentCategory !== undefined) {
            category.parentCategory = parentCategory || null;
        }
        if (status) category.status = status;
        if (sortOrder !== undefined) category.sortOrder = sortOrder;

        // Handle image upload if present
        if (req.file) {
            // Delete old image if exists
            if (category.image && fs.existsSync(category.image)) {
                fs.unlinkSync(category.image);
            }
            category.image = req.file.path;
        }

        await category.save();
        await category.populate('parentCategory', 'name slug');

        return sendResponse(res, 200, true, 'Category updated successfully', category);

    } catch (error) {
        console.error('Update category error:', error);
        
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            return sendResponse(res, 400, false, errors.join(', '));
        }

        if (error.name === 'CastError') {
            return sendResponse(res, 400, false, 'Invalid category ID');
        }

        return sendResponse(res, 500, false, 'Internal server error');
    }
};

// Delete category (soft delete)
const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;

        const category = await Category.findOne({ 
            _id: id, 
            isDeleted: false 
        });

        if (!category) {
            return sendResponse(res, 404, false, 'Category not found');
        }

        // Check if category has children
        const children = await category.getChildren();
        if (children.length > 0) {
            return sendResponse(res, 400, false, 'Cannot delete category that has sub-categories. Delete or move sub-categories first.');
        }

        // Soft delete
        category.isDeleted = true;
        await category.save();

        return sendResponse(res, 200, true, 'Category deleted successfully');

    } catch (error) {
        console.error('Delete category error:', error);
        
        if (error.name === 'CastError') {
            return sendResponse(res, 400, false, 'Invalid category ID');
        }

        return sendResponse(res, 500, false, 'Internal server error');
    }
};

// Get category tree
const getCategoryTree = async (req, res) => {
    try {
        const tree = await Category.buildNestedTree();
        return sendResponse(res, 200, true, 'Category tree retrieved successfully', tree);

    } catch (error) {
        console.error('Get category tree error:', error);
        return sendResponse(res, 500, false, 'Internal server error');
    }
};

// Get parent categories (for dropdown)
const getParentCategories = async (req, res) => {
    try {
        const categories = await Category.find({ 
            isDeleted: false,
            status: 'Active'
        })
        .select('name slug level')
        .sort({ level: 1, name: 1 });

        return sendResponse(res, 200, true, 'Parent categories retrieved successfully', categories);

    } catch (error) {
        console.error('Get parent categories error:', error);
        return sendResponse(res, 500, false, 'Internal server error');
    }
};

// Bulk update category status
const bulkUpdateStatus = async (req, res) => {
    try {
        const { categoryIds, status } = req.body;

        if (!categoryIds || !Array.isArray(categoryIds) || categoryIds.length === 0) {
            return sendResponse(res, 400, false, 'Category IDs are required');
        }

        if (!['Active', 'Inactive'].includes(status)) {
            return sendResponse(res, 400, false, 'Invalid status');
        }

        const result = await Category.updateMany(
            { 
                _id: { $in: categoryIds },
                isDeleted: false 
            },
            { status }
        );

        return sendResponse(res, 200, true, `${result.modifiedCount} categories updated successfully`);

    } catch (error) {
        console.error('Bulk update status error:', error);
        return sendResponse(res, 500, false, 'Internal server error');
    }
};

// Helper function to check circular reference
const checkCircularReference = async (categoryId, parentId) => {
    if (!parentId) return false;
    
    const parent = await Category.findById(parentId);
    if (!parent) return false;
    
    // Check if the parent's path contains the current category
    if (parent.path.includes(categoryId)) {
        return true;
    }
    
    return false;
};

module.exports = {
    createCategory,
    getCategories,
    getCategoryById,
    updateCategory,
    deleteCategory,
    getCategoryTree,
    getParentCategories,
    bulkUpdateStatus
};
