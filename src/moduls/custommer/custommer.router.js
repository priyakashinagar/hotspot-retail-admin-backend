const express = require('express');
const router = express.Router();
const {
    createCustomer,
    getAllCustomers,
    getCustomerById,
    updateCustomer,
    deleteCustomer,
    deactivateCustomer,
    activateCustomer,
    searchCustomers,
    getCustomerStats
} = require('./custommer.controller');
const auth = require('../../middleware/auth.middleware');

/**
 * @swagger
 * components:
 *   schemas:
 *     Customer:
 *       type: object
 *       required:
 *         - fullName
 *         - email
 *         - mobileNumber
 *         - gender
 *         - address
 *         - city
 *         - state
 *         - pincode
 *         - dateOfBirth
 *       properties:
 *         _id:
 *           type: string
 *           description: Customer ID
 *           example: "60f7b3b3b3b3b3b3b3b3b3b3"
 *         fullName:
 *           type: string
 *           minLength: 2
 *           maxLength: 100
 *           description: Customer's full name
 *           example: "John Doe"
 *         email:
 *           type: string
 *           format: email
 *           description: Customer's email address
 *           example: "john.doe@example.com"
 *         mobileNumber:
 *           type: string
 *           pattern: '^[+]?[\d\s\-()]{10,15}$'
 *           description: Customer's mobile number
 *           example: "+91 9876543210"
 *         gender:
 *           type: string
 *           enum: [Male, Female, Other]
 *           description: Customer's gender
 *           example: "Male"
 *         address:
 *           type: string
 *           maxLength: 500
 *           description: Customer's address
 *           example: "123 Main Street, Apartment 4B"
 *         city:
 *           type: string
 *           maxLength: 100
 *           description: Customer's city
 *           example: "Mumbai"
 *         state:
 *           type: string
 *           maxLength: 100
 *           description: Customer's state
 *           example: "Maharashtra"
 *         pincode:
 *           type: string
 *           pattern: '^[0-9]{6}$'
 *           description: Customer's pincode
 *           example: "400001"
 *         dateOfBirth:
 *           type: string
 *           format: date
 *           description: Customer's date of birth
 *           example: "1990-05-15"
 *         membership:
 *           type: string
 *           enum: [Regular, Premium, VIP, Gold, Silver]
 *           description: Customer's membership type
 *           example: "Premium"
 *         notes:
 *           type: string
 *           maxLength: 1000
 *           description: Additional notes about the customer
 *           example: "Prefers evening delivery"
 *         isActive:
 *           type: boolean
 *           description: Customer account status
 *           example: true
 *         age:
 *           type: number
 *           description: Customer's age (calculated from date of birth)
 *           example: 33
 *         fullAddress:
 *           type: string
 *           description: Complete address string
 *           example: "123 Main Street, Apartment 4B, Mumbai, Maharashtra - 400001"
 *         lastVisit:
 *           type: string
 *           format: date-time
 *           description: Last visit timestamp
 *           example: "2024-01-15T10:30:00.000Z"
 *         totalPurchases:
 *           type: number
 *           description: Total number of purchases
 *           example: 25
 *         totalSpent:
 *           type: number
 *           description: Total amount spent
 *           example: 15000.50
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Account creation timestamp
 *           example: "2024-01-01T00:00:00.000Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *           example: "2024-01-15T10:30:00.000Z"
 *     
 *     CustomerCreateRequest:
 *       type: object
 *       required:
 *         - fullName
 *         - email
 *         - mobileNumber
 *         - gender
 *         - address
 *         - city
 *         - state
 *         - pincode
 *         - dateOfBirth
 *       properties:
 *         fullName:
 *           type: string
 *           minLength: 2
 *           maxLength: 100
 *           description: Customer's full name
 *           example: "John Doe"
 *         email:
 *           type: string
 *           format: email
 *           description: Customer's email address
 *           example: "john.doe@example.com"
 *         mobileNumber:
 *           type: string
 *           description: Customer's mobile number
 *           example: "9876543210"
 *         gender:
 *           type: string
 *           enum: [Male, Female, Other]
 *           description: Customer's gender
 *           example: "Male"
 *         address:
 *           type: string
 *           maxLength: 500
 *           description: Customer's address
 *           example: "123 Main Street, Apartment 4B"
 *         city:
 *           type: string
 *           maxLength: 100
 *           description: Customer's city
 *           example: "Mumbai"
 *         state:
 *           type: string
 *           maxLength: 100
 *           description: Customer's state
 *           example: "Maharashtra"
 *         pincode:
 *           type: string
 *           pattern: '^[0-9]{6}$'
 *           description: Customer's pincode
 *           example: "400001"
 *         dateOfBirth:
 *           type: string
 *           format: date
 *           description: Customer's date of birth
 *           example: "1990-05-15"
 *         membership:
 *           type: string
 *           enum: [Regular, Premium, VIP, Gold, Silver]
 *           description: Customer's membership type
 *           example: "Regular"
 *         notes:
 *           type: string
 *           maxLength: 1000
 *           description: Additional notes about the customer
 *           example: "Prefers evening delivery"
 *     
 *     CustomerUpdateRequest:
 *       type: object
 *       properties:
 *         fullName:
 *           type: string
 *           minLength: 2
 *           maxLength: 100
 *           description: Customer's full name
 *           example: "John Smith"
 *         email:
 *           type: string
 *           format: email
 *           description: Customer's email address
 *           example: "john.smith@example.com"
 *         mobileNumber:
 *           type: string
 *           description: Customer's mobile number
 *           example: "9876543211"
 *         gender:
 *           type: string
 *           enum: [Male, Female, Other]
 *           description: Customer's gender
 *           example: "Male"
 *         address:
 *           type: string
 *           maxLength: 500
 *           description: Customer's address
 *           example: "456 New Street, Apartment 2A"
 *         city:
 *           type: string
 *           maxLength: 100
 *           description: Customer's city
 *           example: "Delhi"
 *         state:
 *           type: string
 *           maxLength: 100
 *           description: Customer's state
 *           example: "Delhi"
 *         pincode:
 *           type: string
 *           pattern: '^[0-9]{6}$'
 *           description: Customer's pincode
 *           example: "110001"
 *         dateOfBirth:
 *           type: string
 *           format: date
 *           description: Customer's date of birth
 *           example: "1990-05-15"
 *         membership:
 *           type: string
 *           enum: [Regular, Premium, VIP, Gold, Silver]
 *           description: Customer's membership type
 *           example: "Premium"
 *         notes:
 *           type: string
 *           maxLength: 1000
 *           description: Additional notes about the customer
 *           example: "Updated delivery preferences"
 * 
 *     CustomerStats:
 *       type: object
 *       properties:
 *         total:
 *           type: number
 *           description: Total number of customers
 *           example: 1250
 *         active:
 *           type: number
 *           description: Number of active customers
 *           example: 1200
 *         inactive:
 *           type: number
 *           description: Number of inactive customers
 *           example: 50
 *         recent:
 *           type: number
 *           description: Number of customers registered in last 30 days
 *           example: 75
 *         membershipDistribution:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               _id:
 *                 type: string
 *                 example: "Premium"
 *               count:
 *                 type: number
 *                 example: 300
 *         genderDistribution:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               _id:
 *                 type: string
 *                 example: "Male"
 *               count:
 *                 type: number
 *                 example: 650
 *         topCities:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               _id:
 *                 type: string
 *                 example: "Mumbai"
 *               count:
 *                 type: number
 *                 example: 450
 */

/**
 * @swagger
 * tags:
 *   name: Customers
 *   description: Customer management endpoints
 */

/**
 * @swagger
 * /api/customers:
 *   post:
 *     summary: Create a new customer
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CustomerCreateRequest'
 *     responses:
 *       201:
 *         description: Customer created successfully
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
 *                   example: "Customer created successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Customer'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Customer already exists
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
router.post('/', auth, createCustomer);

/**
 * @swagger
 * /api/customers:
 *   get:
 *     summary: Get all customers with pagination and filters
 *     tags: [Customers]
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
 *         description: Number of customers per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for name, email, or mobile number
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [fullName, email, createdAt, updatedAt, membership]
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
 *         name: membership
 *         schema:
 *           type: string
 *           enum: [Regular, Premium, VIP, Gold, Silver]
 *         description: Filter by membership type
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *         description: Filter by city
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *         description: Filter by state
 *     responses:
 *       200:
 *         description: Customers retrieved successfully
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
 *                   example: "Customers retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     customers:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Customer'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         currentPage:
 *                           type: number
 *                           example: 1
 *                         totalPages:
 *                           type: number
 *                           example: 10
 *                         totalCustomers:
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
router.get('/', auth, getAllCustomers);

/**
 * @swagger
 * /api/customers/search:
 *   get:
 *     summary: Search customers with advanced filters
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search query for name, email, or mobile number
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
 *         description: Number of customers per page
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [fullName, email, createdAt, updatedAt, membership]
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
 *         name: membership
 *         schema:
 *           type: string
 *           enum: [Regular, Premium, VIP, Gold, Silver]
 *         description: Filter by membership type
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *         description: Filter by city
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *         description: Filter by state
 *       - in: query
 *         name: ageMin
 *         schema:
 *           type: integer
 *           minimum: 0
 *         description: Minimum age filter
 *       - in: query
 *         name: ageMax
 *         schema:
 *           type: integer
 *           maximum: 150
 *         description: Maximum age filter
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
 *                     customers:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Customer'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         currentPage:
 *                           type: number
 *                           example: 1
 *                         totalPages:
 *                           type: number
 *                           example: 5
 *                         totalCustomers:
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
 *                           example: "john"
 *                         membership:
 *                           type: string
 *                           example: "Premium"
 *                         isActive:
 *                           type: boolean
 *                           example: true
 *                         city:
 *                           type: string
 *                           example: "Mumbai"
 *                         state:
 *                           type: string
 *                           example: "Maharashtra"
 *                         ageMin:
 *                           type: number
 *                           example: 25
 *                         ageMax:
 *                           type: number
 *                           example: 45
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/search', auth, searchCustomers);

/**
 * @swagger
 * /api/customers/stats:
 *   get:
 *     summary: Get customer statistics
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Customer statistics retrieved successfully
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
 *                   example: "Customer statistics retrieved successfully"
 *                 data:
 *                   $ref: '#/components/schemas/CustomerStats'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/stats', auth, getCustomerStats);

/**
 * @swagger
 * /api/customers/{id}:
 *   get:
 *     summary: Get customer by ID
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Customer ID
 *     responses:
 *       200:
 *         description: Customer retrieved successfully
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
 *                   example: "Customer retrieved successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Customer'
 *       400:
 *         description: Invalid customer ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Customer not found
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
router.get('/:id', auth, getCustomerById);

/**
 * @swagger
 * /api/customers/{id}:
 *   put:
 *     summary: Update customer
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Customer ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CustomerUpdateRequest'
 *     responses:
 *       200:
 *         description: Customer updated successfully
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
 *                   example: "Customer updated successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Customer'
 *       400:
 *         description: Invalid customer ID or validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Customer not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Duplicate email or mobile number
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
router.put('/:id', auth, updateCustomer);

/**
 * @swagger
 * /api/customers/{id}:
 *   delete:
 *     summary: Delete customer permanently
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Customer ID
 *     responses:
 *       200:
 *         description: Customer deleted successfully
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
 *                   example: "Customer deleted successfully"
 *       400:
 *         description: Invalid customer ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Customer not found
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
router.delete('/:id', auth, deleteCustomer);

/**
 * @swagger
 * /api/customers/{id}/deactivate:
 *   patch:
 *     summary: Deactivate customer (soft delete)
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Customer ID
 *     responses:
 *       200:
 *         description: Customer deactivated successfully
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
 *                   example: "Customer deactivated successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Customer'
 *       400:
 *         description: Invalid customer ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Customer not found
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
router.patch('/:id/deactivate', auth, deactivateCustomer);

/**
 * @swagger
 * /api/customers/{id}/activate:
 *   patch:
 *     summary: Activate customer
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Customer ID
 *     responses:
 *       200:
 *         description: Customer activated successfully
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
 *                   example: "Customer activated successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Customer'
 *       400:
 *         description: Invalid customer ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Customer not found
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
router.patch('/:id/activate', auth, activateCustomer);

module.exports = router;
