const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const {
    createCategory,
    getCategories,
    getCategoryById,
    updateCategory,
    deleteCategory,
    getCategoryTree,
    getParentCategories,
    bulkUpdateStatus
} = require('./category.controller');

const authMiddleware = require('../../middleware/auth.middleware');

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = 'uploads/categories';
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'category-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
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
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

/**
 * @swagger
 * tags:
 *   name: Categories
 *   description: Product category management endpoints
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Category:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Category ID
 *         name:
 *           type: string
 *           description: Category name
 *         slug:
 *           type: string
 *           description: URL-friendly category name
 *         description:
 *           type: string
 *           description: Category description
 *         parentCategory:
 *           type: string
 *           description: Parent category ID
 *         image:
 *           type: string
 *           description: Category image path
 *         status:
 *           type: string
 *           enum: [Active, Inactive]
 *           description: Category status
 *         level:
 *           type: number
 *           description: Category hierarchy level
 *         path:
 *           type: string
 *           description: Category path in hierarchy
 *         sortOrder:
 *           type: number
 *           description: Display sort order
 *         productCount:
 *           type: number
 *           description: Number of products in category
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     CreateCategoryRequest:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           description: Category name
 *           example: "Electronics"
 *         description:
 *           type: string
 *           description: Category description
 *           example: "Electronic items and gadgets"
 *         parentCategory:
 *           type: string
 *           description: Parent category ID (optional)
 *           example: "60d5ecb54b2f3a1a2c8e4b7a"
 *         status:
 *           type: string
 *           enum: [Active, Inactive]
 *           description: Category status
 *           example: "Active"
 *         sortOrder:
 *           type: number
 *           description: Display sort order
 *           example: 1
 *     UpdateCategoryRequest:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: Category name
 *           example: "Electronics Updated"
 *         description:
 *           type: string
 *           description: Category description
 *           example: "Updated electronic items and gadgets"
 *         parentCategory:
 *           type: string
 *           description: Parent category ID
 *           example: "60d5ecb54b2f3a1a2c8e4b7a"
 *         status:
 *           type: string
 *           enum: [Active, Inactive]
 *           description: Category status
 *           example: "Active"
 *         sortOrder:
 *           type: number
 *           description: Display sort order
 *           example: 2
 *     BulkUpdateRequest:
 *       type: object
 *       required:
 *         - categoryIds
 *         - status
 *       properties:
 *         categoryIds:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of category IDs
 *           example: ["60d5ecb54b2f3a1a2c8e4b7a", "60d5ecb54b2f3a1a2c8e4b7b"]
 *         status:
 *           type: string
 *           enum: [Active, Inactive]
 *           description: New status for categories
 *           example: "Active"
 */

/**
 * @swagger
 * /api/categories:
 *   post:
 *     summary: Create a new category
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Category name
 *               description:
 *                 type: string
 *                 description: Category description
 *               parentCategory:
 *                 type: string
 *                 description: Parent category ID
 *               status:
 *                 type: string
 *                 enum: [Active, Inactive]
 *               sortOrder:
 *                 type: number
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Category image file
 *     responses:
 *       201:
 *         description: Category created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Category'
 *       400:
 *         description: Validation error
 *       409:
 *         description: Category already exists
 *       500:
 *         description: Internal server error
 */
router.post('/', authMiddleware, upload.single('image'), createCategory);

/**
 * @swagger
 * /api/categories:
 *   get:
 *     summary: Get all categories with filtering and pagination
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Active, Inactive]
 *         description: Filter by status
 *       - in: query
 *         name: parentCategory
 *         schema:
 *           type: string
 *         description: Filter by parent category ID (use 'null' for root categories)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in name and description
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: createdAt
 *         description: Sort by field
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Categories retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         categories:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Category'
 *                         pagination:
 *                           type: object
 *                           properties:
 *                             current:
 *                               type: number
 *                             total:
 *                               type: number
 *                             hasNext:
 *                               type: boolean
 *                             hasPrev:
 *                               type: boolean
 *                             totalItems:
 *                               type: number
 *       500:
 *         description: Internal server error
 */
router.get('/', authMiddleware, getCategories);

/**
 * @swagger
 * /api/categories/tree:
 *   get:
 *     summary: Get category tree structure
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Category tree retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         allOf:
 *                           - $ref: '#/components/schemas/Category'
 *                           - type: object
 *                             properties:
 *                               children:
 *                                 type: array
 *                                 items:
 *                                   $ref: '#/components/schemas/Category'
 *       500:
 *         description: Internal server error
 */
router.get('/tree', authMiddleware, getCategoryTree);

/**
 * @swagger
 * /api/categories/parents:
 *   get:
 *     summary: Get all parent categories for dropdown
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Parent categories retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           slug:
 *                             type: string
 *                           level:
 *                             type: number
 *       500:
 *         description: Internal server error
 */
router.get('/parents', authMiddleware, getParentCategories);

/**
 * @swagger
 * /api/categories/bulk-update:
 *   patch:
 *     summary: Bulk update category status
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BulkUpdateRequest'
 *     responses:
 *       200:
 *         description: Categories updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Validation error
 *       500:
 *         description: Internal server error
 */
router.patch('/bulk-update', authMiddleware, bulkUpdateStatus);

/**
 * @swagger
 * /api/categories/{id}:
 *   get:
 *     summary: Get category by ID
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Category ID
 *     responses:
 *       200:
 *         description: Category retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       allOf:
 *                         - $ref: '#/components/schemas/Category'
 *                         - type: object
 *                           properties:
 *                             children:
 *                               type: array
 *                               items:
 *                                 $ref: '#/components/schemas/Category'
 *       400:
 *         description: Invalid category ID
 *       404:
 *         description: Category not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id', authMiddleware, getCategoryById);

/**
 * @swagger
 * /api/categories/{id}:
 *   put:
 *     summary: Update category
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Category ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Category name
 *               description:
 *                 type: string
 *                 description: Category description
 *               parentCategory:
 *                 type: string
 *                 description: Parent category ID
 *               status:
 *                 type: string
 *                 enum: [Active, Inactive]
 *               sortOrder:
 *                 type: number
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Category image file
 *     responses:
 *       200:
 *         description: Category updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Category'
 *       400:
 *         description: Validation error or circular reference
 *       404:
 *         description: Category not found
 *       409:
 *         description: Category name already exists
 *       500:
 *         description: Internal server error
 */
router.put('/:id', authMiddleware, upload.single('image'), updateCategory);

/**
 * @swagger
 * /api/categories/{id}:
 *   delete:
 *     summary: Delete category (soft delete)
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Category ID
 *     responses:
 *       200:
 *         description: Category deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Invalid category ID or category has sub-categories
 *       404:
 *         description: Category not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', authMiddleware, deleteCategory);

module.exports = router;
