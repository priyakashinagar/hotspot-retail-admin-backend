const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middleware/auth.middleware');
const {
  createSupplier,
  getSuppliers,
  getSupplierById,
  updateSupplier,
  deleteSupplier,
  toggleSupplierStatus
} = require('./suppliers.controller');

/**
 * @swagger
 * tags:
 *   name: Suppliers
 *   description: Supplier management endpoints
 */

/**
 * @swagger
 * /api/suppliers:
 *   post:
 *     summary: Create a new supplier
 *     tags: [Suppliers]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - supplierName
 *               - contactPerson
 *               - email
 *               - phone
 *             properties:
 *               supplierName:
 *                 type: string
 *                 example: "ABC Traders"
 *               contactPerson:
 *                 type: string
 *                 example: "John Doe"
 *               email:
 *                 type: string
 *                 example: "abc@traders.com"
 *               phone:
 *                 type: string
 *                 example: "+919876543210"
 *               address:
 *                 type: string
 *                 example: "123, Main Street, Mumbai"
 *               city:
 *                 type: string
 *                 example: "Mumbai"
 *               state:
 *                 type: string
 *                 example: "Maharashtra"
 *               pincode:
 *                 type: string
 *                 example: "400001"
 *               gstNumber:
 *                 type: string
 *                 example: "27AAEPM1234C1Z5"
 *               panNumber:
 *                 type: string
 *                 example: "AAEPM1234C"
 *               category:
 *                 type: string
 *                 example: "Electronics"
 *               paymentTerms:
 *                 type: string
 *                 example: "30 Days"
 *               website:
 *                 type: string
 *                 example: "https://example.com"
 *               notes:
 *                 type: string
 *                 example: "Preferred supplier for electronics."
 *     responses:
 *       201:
 *         description: Supplier created
 *       400:
 *         description: Validation error
 */
router.post('/', authMiddleware, createSupplier);

/**
 * @swagger
 * /api/suppliers:
 *   get:
 *     summary: Get all suppliers (search, filter, pagination)
 *     tags: [Suppliers]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name, contact, email, phone, city, state, GST, PAN
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: List of suppliers
 */
router.get('/', authMiddleware, getSuppliers);

/**
 * @swagger
 * /api/suppliers/{id}:
 *   get:
 *     summary: Get supplier by ID
 *     tags: [Suppliers]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Supplier found
 *       404:
 *         description: Supplier not found
 */
router.get('/:id', authMiddleware, getSupplierById);

/**
 * @swagger
 * /api/suppliers/{id}:
 *   put:
 *     summary: Update supplier
 *     tags: [Suppliers]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Supplier updated
 *       404:
 *         description: Supplier not found
 */
router.put('/:id', authMiddleware, updateSupplier);

/**
 * @swagger
 * /api/suppliers/{id}:
 *   delete:
 *     summary: Delete supplier
 *     tags: [Suppliers]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Supplier deleted
 *       404:
 *         description: Supplier not found
 */
router.delete('/:id', authMiddleware, deleteSupplier);

/**
 * @swagger
 * /api/suppliers/{id}/toggle-status:
 *   patch:
 *     summary: Toggle supplier active/inactive status
 *     tags: [Suppliers]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Supplier status updated
 *       404:
 *         description: Supplier not found
 */
router.patch('/:id/toggle-status', authMiddleware, toggleSupplierStatus);

module.exports = router;
