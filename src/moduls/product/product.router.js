const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const {
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
} = require('./product.controller');
const auth = require('../../middleware/auth.middleware');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../../uploads/products');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'product-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    // Check file type
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
        files: 10 // Maximum 10 files
    }
});

/**
 * @swagger
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       required:
 *         - productName
 *         - sku
 *         - category
 *         - price
 *         - quantity
 *       properties:
 *         _id:
 *           type: string
 *           description: Product ID
 *           example: "60f7b3b3b3b3b3b3b3b3b3b3"
 *         productName:
 *           type: string
 *           minLength: 2
 *           maxLength: 200
 *           description: Product name
 *           example: "iPhone 14 Pro Max"
 *         sku:
 *           type: string
 *           pattern: '^[A-Z0-9-_]{3,20}$'
 *           description: Stock Keeping Unit (SKU)
 *           example: "IPH-14-PM-256-BLK"
 *         category:
 *           type: string
 *           description: Category ID reference
 *           example: "60f7b3b3b3b3b3b3b3b3b3b3"
 *         price:
 *           type: number
 *           minimum: 0
 *           description: Regular price
 *           example: 129999.99
 *         salePrice:
 *           type: number
 *           minimum: 0
 *           description: Sale price (optional)
 *           example: 119999.99
 *         quantity:
 *           type: number
 *           minimum: 0
 *           description: Stock quantity
 *           example: 50
 *         description:
 *           type: string
 *           maxLength: 2000
 *           description: Product description
 *           example: "Latest iPhone with Pro camera system and A16 Bionic chip"
 *         productImages:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               url:
 *                 type: string
 *                 example: "/uploads/products/product-1634567890123-456789.jpg"
 *               altText:
 *                 type: string
 *                 example: "iPhone 14 Pro Max - Front View"
 *               isPrimary:
 *                 type: boolean
 *                 example: true
 *         weight:
 *           type: number
 *           minimum: 0
 *           description: Product weight in kg
 *           example: 0.240
 *         status:
 *           type: string
 *           enum: [Active, Inactive, Draft, Discontinued]
 *           description: Product status
 *           example: "Active"
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           description: Product tags
 *           example: ["smartphone", "apple", "premium"]
 *         inStock:
 *           type: boolean
 *           description: Stock availability
 *           example: true
 *         slug:
 *           type: string
 *           description: URL-friendly slug
 *           example: "iphone-14-pro-max-iph-14-pm-256-blk"
 *         brand:
 *           type: string
 *           description: Product brand
 *           example: "Apple"
 *         dimensions:
 *           type: object
 *           properties:
 *             length:
 *               type: number
 *               example: 16.07
 *             width:
 *               type: number
 *               example: 7.85
 *             height:
 *               type: number
 *               example: 0.78
 *             unit:
 *               type: string
 *               enum: [cm, inch, mm]
 *               example: "cm"
 *         ratings:
 *           type: object
 *           properties:
 *             average:
 *               type: number
 *               minimum: 0
 *               maximum: 5
 *               example: 4.5
 *             count:
 *               type: number
 *               minimum: 0
 *               example: 1250
 *         effectivePrice:
 *           type: number
 *           description: Current effective price (sale price if available, otherwise regular price)
 *           example: 119999.99
 *         discountPercentage:
 *           type: number
 *           description: Discount percentage if sale price is set
 *           example: 8
 *         isLowStock:
 *           type: boolean
 *           description: Whether product is low in stock
 *           example: false
 *         isFeatured:
 *           type: boolean
 *           description: Whether product is featured
 *           example: true
 *         viewCount:
 *           type: number
 *           description: Number of times product was viewed
 *           example: 1500
 *         salesCount:
 *           type: number
 *           description: Number of times product was sold
 *           example: 45
 *         lowStockThreshold:
 *           type: number
 *           description: Threshold for low stock warning
 *           example: 10
 *         metaTitle:
 *           type: string
 *           maxLength: 60
 *           description: SEO meta title
 *           example: "iPhone 14 Pro Max - Buy Online"
 *         metaDescription:
 *           type: string
 *           maxLength: 160
 *           description: SEO meta description
 *           example: "Get the latest iPhone 14 Pro Max with advanced camera and A16 chip. Free shipping available."
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Product creation timestamp
 *           example: "2024-01-01T00:00:00.000Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *           example: "2024-01-15T10:30:00.000Z"
 *     
 *     ProductCreateRequest:
 *       type: object
 *       required:
 *         - productName
 *         - sku
 *         - category
 *         - price
 *         - quantity
 *       properties:
 *         productName:
 *           type: string
 *           minLength: 2
 *           maxLength: 200
 *           description: Product name
 *           example: "iPhone 14 Pro Max"
 *         sku:
 *           type: string
 *           description: Stock Keeping Unit (SKU)
 *           example: "IPH-14-PM-256-BLK"
 *         category:
 *           type: string
 *           description: Category ID
 *           example: "60f7b3b3b3b3b3b3b3b3b3b3"
 *         price:
 *           type: number
 *           minimum: 0
 *           description: Regular price
 *           example: 129999.99
 *         salePrice:
 *           type: number
 *           minimum: 0
 *           description: Sale price (optional)
 *           example: 119999.99
 *         quantity:
 *           type: number
 *           minimum: 0
 *           description: Stock quantity
 *           example: 50
 *         description:
 *           type: string
 *           maxLength: 2000
 *           description: Product description
 *           example: "Latest iPhone with Pro camera system and A16 Bionic chip"
 *         weight:
 *           type: number
 *           minimum: 0
 *           description: Product weight in kg
 *           example: 0.240
 *         status:
 *           type: string
 *           enum: [Active, Inactive, Draft, Discontinued]
 *           description: Product status
 *           example: "Active"
 *         tags:
 *           type: string
 *           description: Comma-separated tags
 *           example: "smartphone,apple,premium"
 *         inStock:
 *           type: boolean
 *           description: Stock availability
 *           example: true
 *         brand:
 *           type: string
 *           description: Product brand
 *           example: "Apple"
 *         dimensions:
 *           type: string
 *           description: JSON string of dimensions object
 *           example: '{"length":16.07,"width":7.85,"height":0.78,"unit":"cm"}'
 *         lowStockThreshold:
 *           type: number
 *           description: Threshold for low stock warning
 *           example: 10
 *         isFeatured:
 *           type: boolean
 *           description: Whether product is featured
 *           example: true
 *         metaTitle:
 *           type: string
 *           maxLength: 60
 *           description: SEO meta title
 *           example: "iPhone 14 Pro Max - Buy Online"
 *         metaDescription:
 *           type: string
 *           maxLength: 160
 *           description: SEO meta description
 *           example: "Get the latest iPhone 14 Pro Max with advanced camera and A16 chip."
 * 
 *     ProductStats:
 *       type: object
 *       properties:
 *         total:
 *           type: number
 *           description: Total number of products
 *           example: 500
 *         active:
 *           type: number
 *           description: Number of active products
 *           example: 450
 *         inactive:
 *           type: number
 *           description: Number of inactive products
 *           example: 30
 *         outOfStock:
 *           type: number
 *           description: Number of out-of-stock products
 *           example: 15
 *         lowStock:
 *           type: number
 *           description: Number of low-stock products
 *           example: 25
 *         featured:
 *           type: number
 *           description: Number of featured products
 *           example: 50
 *         categoryDistribution:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               _id:
 *                 type: string
 *                 example: "Electronics"
 *               count:
 *                 type: number
 *                 example: 200
 *         statusDistribution:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               _id:
 *                 type: string
 *                 example: "Active"
 *               count:
 *                 type: number
 *                 example: 450
 *         priceStatistics:
 *           type: object
 *           properties:
 *             avgPrice:
 *               type: number
 *               example: 25000.50
 *             minPrice:
 *               type: number
 *               example: 999.99
 *             maxPrice:
 *               type: number
 *               example: 199999.99
 *             totalValue:
 *               type: number
 *               example: 12500000.00
 */

/**
 * @swagger
 * tags:
 *   name: Products
 *   description: Product management endpoints
 */

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Create a new product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - productName
 *               - sku
 *               - category
 *               - price
 *               - quantity
 *             properties:
 *               productName:
 *                 type: string
 *                 description: Product name
 *               sku:
 *                 type: string
 *                 description: Stock Keeping Unit
 *               category:
 *                 type: string
 *                 description: Category ID
 *               price:
 *                 type: number
 *                 description: Regular price
 *               salePrice:
 *                 type: number
 *                 description: Sale price (optional)
 *               quantity:
 *                 type: number
 *                 description: Stock quantity
 *               description:
 *                 type: string
 *                 description: Product description
 *               weight:
 *                 type: number
 *                 description: Product weight in kg
 *               status:
 *                 type: string
 *                 enum: [Active, Inactive, Draft, Discontinued]
 *                 description: Product status
 *               tags:
 *                 type: string
 *                 description: Comma-separated tags
 *               inStock:
 *                 type: boolean
 *                 description: Stock availability
 *               productImages:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Product images (max 10 files, 5MB each)
 *               brand:
 *                 type: string
 *                 description: Product brand
 *               dimensions:
 *                 type: string
 *                 description: JSON string of dimensions
 *               lowStockThreshold:
 *                 type: number
 *                 description: Low stock threshold
 *               isFeatured:
 *                 type: boolean
 *                 description: Featured product flag
 *               metaTitle:
 *                 type: string
 *                 description: SEO meta title
 *               metaDescription:
 *                 type: string
 *                 description: SEO meta description
 *     responses:
 *       201:
 *         description: Product created successfully
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
 *                   example: "Product created successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Product'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Product with this SKU already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/', auth, upload.array('productImages', 10), createProduct);

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Get all products with pagination and filters
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
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
 *           default: 10
 *         description: Number of products per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for name, description, SKU, or tags
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [productName, price, quantity, createdAt, updatedAt]
 *           default: createdAt
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Active, Inactive, Draft, Discontinued]
 *         description: Filter by status
 *       - in: query
 *         name: inStock
 *         schema:
 *           type: boolean
 *         description: Filter by stock availability
 *       - in: query
 *         name: priceMin
 *         schema:
 *           type: number
 *         description: Minimum price filter
 *       - in: query
 *         name: priceMax
 *         schema:
 *           type: number
 *         description: Maximum price filter
 *       - in: query
 *         name: isFeatured
 *         schema:
 *           type: boolean
 *         description: Filter by featured status
 *       - in: query
 *         name: tags
 *         schema:
 *           type: string
 *         description: Filter by tags (comma-separated)
 *     responses:
 *       200:
 *         description: Products retrieved successfully
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
 *                   example: "Products retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     products:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Product'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         currentPage:
 *                           type: number
 *                           example: 1
 *                         totalPages:
 *                           type: number
 *                           example: 10
 *                         totalProducts:
 *                           type: number
 *                           example: 100
 *                         hasNextPage:
 *                           type: boolean
 *                           example: true
 *                         hasPrevPage:
 *                           type: boolean
 *                           example: false
 *                         limit:
 *                           type: number
 *                           example: 10
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/', auth, getAllProducts);

/**
 * @swagger
 * /api/products/search:
 *   get:
 *     summary: Search products with advanced filters
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search query for name, description, SKU, or tags
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
 *           default: 10
 *         description: Number of products per page
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [productName, price, quantity, createdAt, updatedAt]
 *           default: createdAt
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Active, Inactive, Draft, Discontinued]
 *         description: Filter by status
 *       - in: query
 *         name: inStock
 *         schema:
 *           type: boolean
 *         description: Filter by stock availability
 *       - in: query
 *         name: priceMin
 *         schema:
 *           type: number
 *         description: Minimum price filter
 *       - in: query
 *         name: priceMax
 *         schema:
 *           type: number
 *         description: Maximum price filter
 *       - in: query
 *         name: isFeatured
 *         schema:
 *           type: boolean
 *         description: Filter by featured status
 *       - in: query
 *         name: tags
 *         schema:
 *           type: string
 *         description: Filter by tags (comma-separated)
 *     responses:
 *       200:
 *         description: Search completed successfully
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
 *                   example: "Search completed successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     products:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Product'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         currentPage:
 *                           type: number
 *                           example: 1
 *                         totalPages:
 *                           type: number
 *                           example: 5
 *                         totalProducts:
 *                           type: number
 *                           example: 50
 *                         hasNextPage:
 *                           type: boolean
 *                           example: true
 *                         hasPrevPage:
 *                           type: boolean
 *                           example: false
 *                         limit:
 *                           type: number
 *                           example: 10
 *                     filters:
 *                       type: object
 *                       properties:
 *                         searchTerm:
 *                           type: string
 *                           example: "iphone"
 *                         category:
 *                           type: string
 *                           example: "60f7b3b3b3b3b3b3b3b3b3b3"
 *                         status:
 *                           type: string
 *                           example: "Active"
 *                         inStock:
 *                           type: boolean
 *                           example: true
 *                         priceMin:
 *                           type: number
 *                           example: 10000
 *                         priceMax:
 *                           type: number
 *                           example: 200000
 *                         isFeatured:
 *                           type: boolean
 *                           example: true
 *                         tags:
 *                           type: string
 *                           example: "smartphone,premium"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/search', auth, searchProducts);

/**
 * @swagger
 * /api/products/featured:
 *   get:
 *     summary: Get featured products
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *         description: Number of featured products to retrieve
 *     responses:
 *       200:
 *         description: Featured products retrieved successfully
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
 *                   example: "Featured products retrieved successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/featured', auth, getFeaturedProducts);

/**
 * @swagger
 * /api/products/low-stock:
 *   get:
 *     summary: Get low stock products
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Low stock products retrieved successfully
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
 *                   example: "Low stock products retrieved successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/low-stock', auth, getLowStockProducts);

/**
 * @swagger
 * /api/products/stats:
 *   get:
 *     summary: Get product statistics
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Product statistics retrieved successfully
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
 *                   example: "Product statistics retrieved successfully"
 *                 data:
 *                   $ref: '#/components/schemas/ProductStats'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/stats', auth, getProductStats);

/**
 * @swagger
 * /api/products/sku/{sku}:
 *   get:
 *     summary: Get product by SKU
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sku
 *         required: true
 *         schema:
 *           type: string
 *         description: Product SKU
 *     responses:
 *       200:
 *         description: Product retrieved successfully
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
 *                   example: "Product retrieved successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Product'
 *       404:
 *         description: Product not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/sku/:sku', auth, getProductBySku);

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Get product by ID
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product retrieved successfully
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
 *                   example: "Product retrieved successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Product'
 *       400:
 *         description: Invalid product ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Product not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/:id', auth, getProductById);

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Update product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               productName:
 *                 type: string
 *                 description: Product name
 *               sku:
 *                 type: string
 *                 description: Stock Keeping Unit
 *               category:
 *                 type: string
 *                 description: Category ID
 *               price:
 *                 type: number
 *                 description: Regular price
 *               salePrice:
 *                 type: number
 *                 description: Sale price (optional)
 *               quantity:
 *                 type: number
 *                 description: Stock quantity
 *               description:
 *                 type: string
 *                 description: Product description
 *               weight:
 *                 type: number
 *                 description: Product weight in kg
 *               status:
 *                 type: string
 *                 enum: [Active, Inactive, Draft, Discontinued]
 *                 description: Product status
 *               tags:
 *                 type: string
 *                 description: Comma-separated tags
 *               inStock:
 *                 type: boolean
 *                 description: Stock availability
 *               productImages:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Additional product images
 *               brand:
 *                 type: string
 *                 description: Product brand
 *               dimensions:
 *                 type: string
 *                 description: JSON string of dimensions
 *               lowStockThreshold:
 *                 type: number
 *                 description: Low stock threshold
 *               isFeatured:
 *                 type: boolean
 *                 description: Featured product flag
 *               metaTitle:
 *                 type: string
 *                 description: SEO meta title
 *               metaDescription:
 *                 type: string
 *                 description: SEO meta description
 *     responses:
 *       200:
 *         description: Product updated successfully
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
 *                   example: "Product updated successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Product'
 *       400:
 *         description: Invalid product ID or validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Product not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Duplicate SKU
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.put('/:id', auth, upload.array('productImages', 10), updateProduct);

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Delete product permanently
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product deleted successfully
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
 *                   example: "Product deleted successfully"
 *       400:
 *         description: Invalid product ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Product not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete('/:id', auth, deleteProduct);

/**
 * @swagger
 * /api/products/{id}/status:
 *   patch:
 *     summary: Update product status
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [Active, Inactive, Draft, Discontinued]
 *                 description: New product status
 *                 example: "Inactive"
 *     responses:
 *       200:
 *         description: Product status updated successfully
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
 *                   example: "Product status updated successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Product'
 *       400:
 *         description: Invalid product ID or status value
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Product not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.patch('/:id/status', auth, updateProductStatus);

/**
 * @swagger
 * /api/products/{id}/stock:
 *   patch:
 *     summary: Update product stock
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - quantity
 *             properties:
 *               quantity:
 *                 type: number
 *                 minimum: 0
 *                 description: Quantity value
 *                 example: 50
 *               operation:
 *                 type: string
 *                 enum: [set, add, subtract]
 *                 default: set
 *                 description: Stock operation type
 *                 example: "add"
 *     responses:
 *       200:
 *         description: Product stock updated successfully
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
 *                   example: "Product stock updated successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Product'
 *       400:
 *         description: Invalid product ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Product not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.patch('/:id/stock', auth, updateProductStock);

/**
 * @swagger
 * /api/products/{id}/images/{imageIndex}:
 *   delete:
 *     summary: Remove product image
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *       - in: path
 *         name: imageIndex
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 0
 *         description: Image index to remove
 *     responses:
 *       200:
 *         description: Product image removed successfully
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
 *                   example: "Product image removed successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Product'
 *       400:
 *         description: Invalid product ID or image index
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Product not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete('/:id/images/:imageIndex', auth, removeProductImage);

module.exports = router;
