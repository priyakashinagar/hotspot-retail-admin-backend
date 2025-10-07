const Product = require('./product.model');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

// Helper function for error responses
const sendErrorResponse = (res, statusCode, message, details = null) => {
    const response = {
        success: false,
        message
    };
    
    if (details) {
        response.details = details;
    }
    
    return res.status(statusCode).json(response);
};

// Helper function for success responses
const sendSuccessResponse = (res, statusCode, message, data = null) => {
    const response = {
        success: true,
        message
    };
    
    if (data !== null) {
        response.data = data;
    }
    
    return res.status(statusCode).json(response);
};

// Create a new product
const createProduct = async (req, res) => {
    try {
        const {
            productName,
            sku,
            category,
            price,
            salePrice,
            quantity,
            description,
            weight,
            status,
            tags,
            inStock,
            brand,
            dimensions,
            lowStockThreshold,
            isFeatured,
            metaTitle,
            metaDescription
        } = req.body;

        // Check if product with same SKU already exists
        const existingProduct = await Product.findOne({ sku: sku.toUpperCase() });
        if (existingProduct) {
            return sendErrorResponse(res, 409, 'Product with this SKU already exists');
        }

        // Process uploaded images
        let productImages = [];
        if (req.files && req.files.length > 0) {
            productImages = req.files.map((file, index) => ({
                url: `/uploads/products/${file.filename}`,
                altText: `${productName} - Image ${index + 1}`,
                isPrimary: index === 0 // First image is primary
            }));
        }

        // Parse tags if it's a string
        let parsedTags = [];
        if (tags) {
            if (typeof tags === 'string') {
                parsedTags = tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
            } else if (Array.isArray(tags)) {
                parsedTags = tags;
            }
        }

        // Parse dimensions if provided
        let parsedDimensions = {};
        if (dimensions) {
            if (typeof dimensions === 'string') {
                try {
                    parsedDimensions = JSON.parse(dimensions);
                } catch (error) {
                    parsedDimensions = {};
                }
            } else {
                parsedDimensions = dimensions;
            }
        }

        // Create new product
        const product = new Product({
            productName,
            sku: sku.toUpperCase(),
            category,
            price: parseFloat(price),
            salePrice: salePrice ? parseFloat(salePrice) : undefined,
            quantity: parseInt(quantity) || 0,
            description,
            productImages,
            weight: weight ? parseFloat(weight) : undefined,
            status: status || 'Active',
            tags: parsedTags,
            inStock: inStock !== undefined ? inStock : true,
            brand,
            dimensions: parsedDimensions,
            lowStockThreshold: lowStockThreshold ? parseInt(lowStockThreshold) : 10,
            isFeatured: isFeatured || false,
            metaTitle,
            metaDescription
        });

        const savedProduct = await product.save();
        await savedProduct.populate('category', 'name slug');
        
        return sendSuccessResponse(res, 201, 'Product created successfully', savedProduct);
    } catch (error) {
        console.error('Create product error:', error);
        
        // Clean up uploaded files if product creation fails
        if (req.files && req.files.length > 0) {
            req.files.forEach(file => {
                const filePath = path.join(__dirname, '../../../uploads/products', file.filename);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            });
        }
        
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            return sendErrorResponse(res, 400, 'Validation failed', errors);
        }
        
        if (error.code === 11000) {
            const field = Object.keys(error.keyValue)[0];
            return sendErrorResponse(res, 409, `${field} already exists`);
        }
        
        return sendErrorResponse(res, 500, 'Internal server error');
    }
};

// Get all products with pagination and filters
const getAllProducts = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            search = '',
            sortBy = 'createdAt',
            sortOrder = 'desc',
            category = '',
            status = '',
            inStock = '',
            priceMin = '',
            priceMax = '',
            isFeatured = '',
            tags = ''
        } = req.query;

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        // Build query object
        const query = {};
        
        if (search) {
            query.$or = [
                { productName: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { sku: { $regex: search, $options: 'i' } },
                { tags: { $in: [new RegExp(search, 'i')] } }
            ];
        }
        
        if (category) query.category = category;
        if (status) query.status = status;
        if (inStock !== '') query.inStock = inStock === 'true';
        if (isFeatured !== '') query.isFeatured = isFeatured === 'true';
        if (tags) query.tags = { $in: tags.split(',').map(tag => tag.trim()) };
        
        // Price range filter
        if (priceMin || priceMax) {
            const priceFilter = {};
            if (priceMin) priceFilter.$gte = parseFloat(priceMin);
            if (priceMax) priceFilter.$lte = parseFloat(priceMax);
            query.price = priceFilter;
        }

        // Build sort object
        const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

        // Get products with pagination
        const products = await Product.find(query)
            .populate('category', 'name slug')
            .sort(sort)
            .skip(skip)
            .limit(limitNum)
            .lean();

        // Get total count for pagination
        const totalProducts = await Product.countDocuments(query);
        const totalPages = Math.ceil(totalProducts / limitNum);

        const response = {
            products,
            pagination: {
                currentPage: pageNum,
                totalPages,
                totalProducts,
                hasNextPage: pageNum < totalPages,
                hasPrevPage: pageNum > 1,
                limit: limitNum
            }
        };

        return sendSuccessResponse(res, 200, 'Products retrieved successfully', response);
    } catch (error) {
        console.error('Get all products error:', error);
        return sendErrorResponse(res, 500, 'Internal server error');
    }
};

// Get product by ID
const getProductById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return sendErrorResponse(res, 400, 'Invalid product ID');
        }

        const product = await Product.findById(id).populate('category', 'name slug description');

        if (!product) {
            return sendErrorResponse(res, 404, 'Product not found');
        }

        // Increment view count
        await product.incrementViewCount();

        return sendSuccessResponse(res, 200, 'Product retrieved successfully', product);
    } catch (error) {
        console.error('Get product by ID error:', error);
        return sendErrorResponse(res, 500, 'Internal server error');
    }
};

// Get product by SKU
const getProductBySku = async (req, res) => {
    try {
        const { sku } = req.params;

        const product = await Product.findOne({ sku: sku.toUpperCase() })
            .populate('category', 'name slug description');

        if (!product) {
            return sendErrorResponse(res, 404, 'Product not found');
        }

        return sendSuccessResponse(res, 200, 'Product retrieved successfully', product);
    } catch (error) {
        console.error('Get product by SKU error:', error);
        return sendErrorResponse(res, 500, 'Internal server error');
    }
};

// Update product
const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return sendErrorResponse(res, 400, 'Invalid product ID');
        }

        // Check if product exists
        const existingProduct = await Product.findById(id);
        if (!existingProduct) {
            return sendErrorResponse(res, 404, 'Product not found');
        }

        // Check for duplicate SKU (exclude current product)
        if (updateData.sku) {
            const duplicateProduct = await Product.findOne({
                sku: updateData.sku.toUpperCase(),
                _id: { $ne: id }
            });
            if (duplicateProduct) {
                return sendErrorResponse(res, 409, 'Another product already exists with this SKU');
            }
            updateData.sku = updateData.sku.toUpperCase();
        }

        // Process new uploaded images
        if (req.files && req.files.length > 0) {
            const newImages = req.files.map((file, index) => ({
                url: `/uploads/products/${file.filename}`,
                altText: `${updateData.productName || existingProduct.productName} - Image ${index + 1}`,
                isPrimary: index === 0 && (!existingProduct.productImages || existingProduct.productImages.length === 0)
            }));
            
            // Merge with existing images
            updateData.productImages = [...(existingProduct.productImages || []), ...newImages];
        }

        // Parse tags if it's a string
        if (updateData.tags && typeof updateData.tags === 'string') {
            updateData.tags = updateData.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
        }

        // Parse dimensions if provided as string
        if (updateData.dimensions && typeof updateData.dimensions === 'string') {
            try {
                updateData.dimensions = JSON.parse(updateData.dimensions);
            } catch (error) {
                delete updateData.dimensions;
            }
        }

        // Update product
        const updatedProduct = await Product.findByIdAndUpdate(
            id,
            { $set: updateData },
            { 
                new: true, 
                runValidators: true 
            }
        ).populate('category', 'name slug');

        return sendSuccessResponse(res, 200, 'Product updated successfully', updatedProduct);
    } catch (error) {
        console.error('Update product error:', error);
        
        // Clean up uploaded files if update fails
        if (req.files && req.files.length > 0) {
            req.files.forEach(file => {
                const filePath = path.join(__dirname, '../../../uploads/products', file.filename);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            });
        }
        
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            return sendErrorResponse(res, 400, 'Validation failed', errors);
        }
        
        return sendErrorResponse(res, 500, 'Internal server error');
    }
};

// Delete product
const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return sendErrorResponse(res, 400, 'Invalid product ID');
        }

        const product = await Product.findById(id);
        if (!product) {
            return sendErrorResponse(res, 404, 'Product not found');
        }

        // Delete associated images
        if (product.productImages && product.productImages.length > 0) {
            product.productImages.forEach(image => {
                const imagePath = path.join(__dirname, '../../../', image.url);
                if (fs.existsSync(imagePath)) {
                    fs.unlinkSync(imagePath);
                }
            });
        }

        await Product.findByIdAndDelete(id);

        return sendSuccessResponse(res, 200, 'Product deleted successfully');
    } catch (error) {
        console.error('Delete product error:', error);
        return sendErrorResponse(res, 500, 'Internal server error');
    }
};

// Update product status
const updateProductStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return sendErrorResponse(res, 400, 'Invalid product ID');
        }

        if (!['Active', 'Inactive', 'Draft', 'Discontinued'].includes(status)) {
            return sendErrorResponse(res, 400, 'Invalid status value');
        }

        const product = await Product.findByIdAndUpdate(
            id,
            { $set: { status } },
            { new: true }
        ).populate('category', 'name slug');

        if (!product) {
            return sendErrorResponse(res, 404, 'Product not found');
        }

        return sendSuccessResponse(res, 200, 'Product status updated successfully', product);
    } catch (error) {
        console.error('Update product status error:', error);
        return sendErrorResponse(res, 500, 'Internal server error');
    }
};

// Update product stock
const updateProductStock = async (req, res) => {
    try {
        const { id } = req.params;
        const { quantity, operation = 'set' } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return sendErrorResponse(res, 400, 'Invalid product ID');
        }

        const product = await Product.findById(id);
        if (!product) {
            return sendErrorResponse(res, 404, 'Product not found');
        }

        const updatedProduct = await product.updateStock(parseInt(quantity), operation);
        await updatedProduct.populate('category', 'name slug');

        return sendSuccessResponse(res, 200, 'Product stock updated successfully', updatedProduct);
    } catch (error) {
        console.error('Update product stock error:', error);
        return sendErrorResponse(res, 500, 'Internal server error');
    }
};

// Search products with advanced filters
const searchProducts = async (req, res) => {
    try {
        const {
            q = '',
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
        } = req.query;

        const options = {
            page: parseInt(page),
            limit: parseInt(limit),
            sortBy,
            sortOrder,
            category,
            status,
            inStock: inStock !== null ? inStock === 'true' : null,
            priceMin: priceMin ? parseFloat(priceMin) : null,
            priceMax: priceMax ? parseFloat(priceMax) : null,
            isFeatured: isFeatured !== null ? isFeatured === 'true' : null,
            tags
        };

        const products = await Product.searchProducts(q, options);

        // Get total count for pagination
        const totalQuery = {};
        if (q) {
            totalQuery.$or = [
                { productName: { $regex: q, $options: 'i' } },
                { description: { $regex: q, $options: 'i' } },
                { sku: { $regex: q, $options: 'i' } },
                { tags: { $in: [new RegExp(q, 'i')] } }
            ];
        }
        if (category) totalQuery.category = category;
        if (status) totalQuery.status = status;
        if (inStock !== null) totalQuery.inStock = inStock === 'true';
        if (isFeatured !== null) totalQuery.isFeatured = isFeatured === 'true';
        if (tags) totalQuery.tags = { $in: tags.split(',').map(tag => tag.trim()) };
        if (priceMin || priceMax) {
            const priceFilter = {};
            if (priceMin) priceFilter.$gte = parseFloat(priceMin);
            if (priceMax) priceFilter.$lte = parseFloat(priceMax);
            totalQuery.price = priceFilter;
        }

        const totalProducts = await Product.countDocuments(totalQuery);
        const totalPages = Math.ceil(totalProducts / options.limit);

        const response = {
            products,
            pagination: {
                currentPage: options.page,
                totalPages,
                totalProducts,
                hasNextPage: options.page < totalPages,
                hasPrevPage: options.page > 1,
                limit: options.limit
            },
            filters: {
                searchTerm: q,
                category,
                status,
                inStock,
                priceMin,
                priceMax,
                isFeatured,
                tags
            }
        };

        return sendSuccessResponse(res, 200, 'Search completed successfully', response);
    } catch (error) {
        console.error('Search products error:', error);
        return sendErrorResponse(res, 500, 'Internal server error');
    }
};

// Get featured products
const getFeaturedProducts = async (req, res) => {
    try {
        const { limit = 10 } = req.query;

        const products = await Product.find({ 
            isFeatured: true, 
            status: 'Active',
            inStock: true 
        })
        .populate('category', 'name slug')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit));

        return sendSuccessResponse(res, 200, 'Featured products retrieved successfully', products);
    } catch (error) {
        console.error('Get featured products error:', error);
        return sendErrorResponse(res, 500, 'Internal server error');
    }
};

// Get low stock products
const getLowStockProducts = async (req, res) => {
    try {
        const products = await Product.getLowStockProducts();
        return sendSuccessResponse(res, 200, 'Low stock products retrieved successfully', products);
    } catch (error) {
        console.error('Get low stock products error:', error);
        return sendErrorResponse(res, 500, 'Internal server error');
    }
};

// Get product statistics
const getProductStats = async (req, res) => {
    try {
        const totalProducts = await Product.countDocuments();
        const activeProducts = await Product.countDocuments({ status: 'Active' });
        const inactiveProducts = await Product.countDocuments({ status: 'Inactive' });
        const outOfStockProducts = await Product.countDocuments({ inStock: false });
        const lowStockProducts = await Product.countDocuments({ isLowStock: true });
        const featuredProducts = await Product.countDocuments({ isFeatured: true });

        // Category-wise distribution
        const categoryStats = await Product.aggregate([
            {
                $lookup: {
                    from: 'categories',
                    localField: 'category',
                    foreignField: '_id',
                    as: 'categoryInfo'
                }
            },
            {
                $unwind: '$categoryInfo'
            },
            {
                $group: {
                    _id: '$categoryInfo.name',
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);

        // Status distribution
        const statusStats = await Product.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Price range distribution
        const priceStats = await Product.aggregate([
            {
                $group: {
                    _id: null,
                    avgPrice: { $avg: '$price' },
                    minPrice: { $min: '$price' },
                    maxPrice: { $max: '$price' },
                    totalValue: { $sum: { $multiply: ['$price', '$quantity'] } }
                }
            }
        ]);

        const stats = {
            total: totalProducts,
            active: activeProducts,
            inactive: inactiveProducts,
            outOfStock: outOfStockProducts,
            lowStock: lowStockProducts,
            featured: featuredProducts,
            categoryDistribution: categoryStats,
            statusDistribution: statusStats,
            priceStatistics: priceStats[0] || {
                avgPrice: 0,
                minPrice: 0,
                maxPrice: 0,
                totalValue: 0
            }
        };

        return sendSuccessResponse(res, 200, 'Product statistics retrieved successfully', stats);
    } catch (error) {
        console.error('Get product stats error:', error);
        return sendErrorResponse(res, 500, 'Internal server error');
    }
};

// Remove product image
const removeProductImage = async (req, res) => {
    try {
        const { id, imageIndex } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return sendErrorResponse(res, 400, 'Invalid product ID');
        }

        const product = await Product.findById(id);
        if (!product) {
            return sendErrorResponse(res, 404, 'Product not found');
        }

        const index = parseInt(imageIndex);
        if (index < 0 || index >= product.productImages.length) {
            return sendErrorResponse(res, 400, 'Invalid image index');
        }

        // Delete the image file
        const imageToRemove = product.productImages[index];
        const imagePath = path.join(__dirname, '../../../', imageToRemove.url);
        if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
        }

        // Remove image from array
        product.productImages.splice(index, 1);

        // If removed image was primary and there are other images, make first one primary
        if (imageToRemove.isPrimary && product.productImages.length > 0) {
            product.productImages[0].isPrimary = true;
        }

        await product.save();

        return sendSuccessResponse(res, 200, 'Product image removed successfully', product);
    } catch (error) {
        console.error('Remove product image error:', error);
        return sendErrorResponse(res, 500, 'Internal server error');
    }
};

module.exports = {
    createProduct,
    getAllProducts,
    getProductById,
    getProductBySku,
    updateProduct,
    deleteProduct,
    updateProductStatus,
    updateProductStock,
    searchProducts,
    getFeaturedProducts,
    getLowStockProducts,
    getProductStats,
    removeProductImage
};
