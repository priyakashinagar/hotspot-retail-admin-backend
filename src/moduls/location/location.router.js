const express = require('express');
const router = express.Router();
const locationController = require('./location.controller');

/**
 * @swagger
 * components:
 *   schemas:
 *     Location:
 *       type: object
 *       required:
 *         - locationName
 *         - fullAddress
 *         - city
 *         - state
 *         - pincode
 *         - openingTime
 *         - closingTime
 *       properties:
 *         _id:
 *           type: string
 *           description: Unique identifier for the location
 *         locationName:
 *           type: string
 *           description: Name of the location
 *           example: "Main Store"
 *         fullAddress:
 *           type: string
 *           description: Complete address of the location
 *           example: "123 Main Street, Near Central Mall"
 *         city:
 *           type: string
 *           description: City name
 *           example: "Mumbai"
 *         state:
 *           type: string
 *           description: State name
 *           example: "Maharashtra"
 *         pincode:
 *           type: string
 *           description: 6-digit pincode
 *           example: "400001"
 *         phoneNumber:
 *           type: string
 *           description: Contact phone number
 *           example: "+919876543210"
 *         emailAddress:
 *           type: string
 *           format: email
 *           description: Contact email address
 *           example: "store@example.com"
 *         managerName:
 *           type: string
 *           description: Store manager name
 *           example: "John Doe"
 *         openingTime:
 *           type: string
 *           description: Opening time in HH:MM AM/PM format
 *           example: "09:00 AM"
 *         closingTime:
 *           type: string
 *           description: Closing time in HH:MM AM/PM format
 *           example: "09:00 PM"
 *         deliveryAvailable:
 *           type: boolean
 *           description: Whether delivery service is available
 *           example: true
 *         pickupAvailable:
 *           type: boolean
 *           description: Whether pickup service is available
 *           example: true
 *         locationActive:
 *           type: boolean
 *           description: Whether location is active
 *           example: true
 *         coordinates:
 *           type: object
 *           properties:
 *             latitude:
 *               type: number
 *               example: 19.0760
 *             longitude:
 *               type: number
 *               example: 72.8777
 *         deliveryRadius:
 *           type: number
 *           description: Delivery radius in kilometers
 *           example: 10
 *         minimumOrderAmount:
 *           type: number
 *           description: Minimum order amount for delivery
 *           example: 500
 *         deliveryCharge:
 *           type: number
 *           description: Delivery charge
 *           example: 50
 *         description:
 *           type: string
 *           description: Location description
 *           example: "Our flagship store with all facilities"
 *         facilities:
 *           type: array
 *           items:
 *             type: string
 *           description: Available facilities
 *           example: ["Parking", "AC", "WiFi"]
 *         images:
 *           type: array
 *           items:
 *             type: string
 *           description: Location image URLs
 *           example: ["image1.jpg", "image2.jpg"]
 *         fullLocationInfo:
 *           type: string
 *           description: Complete location information
 *           example: "Main Store, Mumbai, Maharashtra - 400001"
 *         operatingHours:
 *           type: string
 *           description: Operating hours
 *           example: "09:00 AM - 09:00 PM"
 *         servicesAvailable:
 *           type: array
 *           items:
 *             type: string
 *           description: Available services
 *           example: ["Delivery", "Pickup"]
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 * 
 *     LocationInput:
 *       type: object
 *       required:
 *         - locationName
 *         - fullAddress
 *         - city
 *         - state
 *         - pincode
 *         - openingTime
 *         - closingTime
 *       properties:
 *         locationName:
 *           type: string
 *           example: "Main Store"
 *         fullAddress:
 *           type: string
 *           example: "123 Main Street, Near Central Mall"
 *         city:
 *           type: string
 *           example: "Mumbai"
 *         state:
 *           type: string
 *           example: "Maharashtra"
 *         pincode:
 *           type: string
 *           example: "400001"
 *         phoneNumber:
 *           type: string
 *           example: "+919876543210"
 *         emailAddress:
 *           type: string
 *           format: email
 *           example: "store@example.com"
 *         managerName:
 *           type: string
 *           example: "John Doe"
 *         openingTime:
 *           type: string
 *           example: "09:00 AM"
 *         closingTime:
 *           type: string
 *           example: "09:00 PM"
 *         deliveryAvailable:
 *           type: boolean
 *           example: true
 *         pickupAvailable:
 *           type: boolean
 *           example: true
 *         locationActive:
 *           type: boolean
 *           example: true
 *         coordinates:
 *           type: object
 *           properties:
 *             latitude:
 *               type: number
 *               example: 19.0760
 *             longitude:
 *               type: number
 *               example: 72.8777
 *         deliveryRadius:
 *           type: number
 *           example: 10
 *         minimumOrderAmount:
 *           type: number
 *           example: 500
 *         deliveryCharge:
 *           type: number
 *           example: 50
 *         description:
 *           type: string
 *           example: "Our flagship store with all facilities"
 *         facilities:
 *           type: array
 *           items:
 *             type: string
 *           example: ["Parking", "AC", "WiFi"]
 *         images:
 *           type: array
 *           items:
 *             type: string
 *           example: ["image1.jpg", "image2.jpg"]
 */

/**
 * @swagger
 * /api/locations:
 *   get:
 *     summary: Get all locations with pagination and filtering
 *     tags: [Locations]
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
 *         description: Number of locations per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by location name, address, manager name, or pincode
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
 *         name: locationActive
 *         schema:
 *           type: string
 *           enum: [true, false]
 *         description: Filter by active status
 *       - in: query
 *         name: deliveryAvailable
 *         schema:
 *           type: string
 *           enum: [true, false]
 *         description: Filter by delivery availability
 *       - in: query
 *         name: pickupAvailable
 *         schema:
 *           type: string
 *           enum: [true, false]
 *         description: Filter by pickup availability
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
 *         description: Locations retrieved successfully
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
 *                   example: "Locations retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     locations:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Location'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         currentPage:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *                         totalItems:
 *                           type: integer
 *                         itemsPerPage:
 *                           type: integer
 *                         hasNextPage:
 *                           type: boolean
 *                         hasPrevPage:
 *                           type: boolean
 *       500:
 *         description: Internal server error
 */
router.get('/', locationController.getAllLocations);

/**
 * @swagger
 * /api/locations/stats:
 *   get:
 *     summary: Get location statistics
 *     tags: [Locations]
 *     responses:
 *       200:
 *         description: Location statistics retrieved successfully
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
 *                   example: "Location statistics retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     overview:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         active:
 *                           type: integer
 *                         inactive:
 *                           type: integer
 *                         deliveryEnabled:
 *                           type: integer
 *                         pickupEnabled:
 *                           type: integer
 *                     stateWise:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           count:
 *                             type: integer
 *                     cityWise:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           count:
 *                             type: integer
 *       500:
 *         description: Internal server error
 */
router.get('/stats', locationController.getLocationStats);

/**
 * @swagger
 * /api/locations/nearby:
 *   get:
 *     summary: Find nearby locations based on coordinates
 *     tags: [Locations]
 *     parameters:
 *       - in: query
 *         name: latitude
 *         required: true
 *         schema:
 *           type: number
 *         description: Latitude coordinate
 *         example: 19.0760
 *       - in: query
 *         name: longitude
 *         required: true
 *         schema:
 *           type: number
 *         description: Longitude coordinate
 *         example: 72.8777
 *       - in: query
 *         name: radius
 *         schema:
 *           type: number
 *           default: 10
 *         description: Search radius in kilometers
 *         example: 5
 *     responses:
 *       200:
 *         description: Nearby locations retrieved successfully
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
 *                   example: "Nearby locations retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     searchCoordinates:
 *                       type: object
 *                       properties:
 *                         latitude:
 *                           type: number
 *                         longitude:
 *                           type: number
 *                     radius:
 *                       type: number
 *                     count:
 *                       type: integer
 *                     locations:
 *                       type: array
 *                       items:
 *                         allOf:
 *                           - $ref: '#/components/schemas/Location'
 *                           - type: object
 *                             properties:
 *                               distance:
 *                                 type: number
 *                                 description: Distance in kilometers
 *       400:
 *         description: Invalid coordinates or missing parameters
 *       500:
 *         description: Internal server error
 */
router.get('/nearby', locationController.findNearbyLocations);

/**
 * @swagger
 * /api/locations/city/{city}:
 *   get:
 *     summary: Get locations by city
 *     tags: [Locations]
 *     parameters:
 *       - in: path
 *         name: city
 *         required: true
 *         schema:
 *           type: string
 *         description: City name
 *         example: "Mumbai"
 *       - in: query
 *         name: locationActive
 *         schema:
 *           type: string
 *           enum: [true, false, '']
 *           default: 'true'
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: Locations in city retrieved successfully
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
 *                   example: "Locations in Mumbai retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     city:
 *                       type: string
 *                     count:
 *                       type: integer
 *                     locations:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Location'
 *       500:
 *         description: Internal server error
 */
router.get('/city/:city', locationController.getLocationsByCity);

/**
 * @swagger
 * /api/locations/{id}/status:
 *   get:
 *     summary: Check if location is currently open
 *     tags: [Locations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Location MongoDB ObjectId
 *     responses:
 *       200:
 *         description: Location status retrieved successfully
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
 *                   example: "Location status retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     locationName:
 *                       type: string
 *                     isOpen:
 *                       type: boolean
 *                     currentTime:
 *                       type: string
 *                     operatingHours:
 *                       type: string
 *                     openingTime:
 *                       type: string
 *                     closingTime:
 *                       type: string
 *                     locationActive:
 *                       type: boolean
 *       400:
 *         description: Invalid location ID format
 *       404:
 *         description: Location not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id/status', locationController.checkLocationStatus);

/**
 * @swagger
 * /api/locations/{id}:
 *   get:
 *     summary: Get location by ID
 *     tags: [Locations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Location MongoDB ObjectId
 *     responses:
 *       200:
 *         description: Location retrieved successfully
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
 *                   example: "Location retrieved successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Location'
 *       400:
 *         description: Invalid location ID format
 *       404:
 *         description: Location not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id', locationController.getLocationById);

/**
 * @swagger
 * /api/locations:
 *   post:
 *     summary: Create a new location
 *     tags: [Locations]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LocationInput'
 *     responses:
 *       201:
 *         description: Location created successfully
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
 *                   example: "Location created successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Location'
 *       400:
 *         description: Validation error or location already exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Validation error"
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: string
 *       500:
 *         description: Internal server error
 */
router.post('/', locationController.createLocation);

/**
 * @swagger
 * /api/locations/{id}:
 *   put:
 *     summary: Update location by ID
 *     tags: [Locations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Location MongoDB ObjectId
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LocationInput'
 *     responses:
 *       200:
 *         description: Location updated successfully
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
 *                   example: "Location updated successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Location'
 *       400:
 *         description: Invalid location ID format or validation error
 *       404:
 *         description: Location not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id', locationController.updateLocation);

/**
 * @swagger
 * /api/locations/{id}:
 *   delete:
 *     summary: Soft delete location (deactivate)
 *     tags: [Locations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Location MongoDB ObjectId
 *     responses:
 *       200:
 *         description: Location deactivated successfully
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
 *                   example: "Location deactivated successfully"
 *       400:
 *         description: Invalid location ID format
 *       404:
 *         description: Location not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', locationController.deleteLocation);

/**
 * @swagger
 * /api/locations/{id}/permanent:
 *   delete:
 *     summary: Permanently delete location
 *     tags: [Locations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Location MongoDB ObjectId
 *     responses:
 *       200:
 *         description: Location permanently deleted successfully
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
 *                   example: "Location permanently deleted successfully"
 *       400:
 *         description: Invalid location ID format
 *       404:
 *         description: Location not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id/permanent', locationController.permanentDeleteLocation);

/**
 * @swagger
 * /api/locations/{id}/restore:
 *   patch:
 *     summary: Restore location (activate)
 *     tags: [Locations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Location MongoDB ObjectId
 *     responses:
 *       200:
 *         description: Location activated successfully
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
 *                   example: "Location activated successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Location'
 *       400:
 *         description: Invalid location ID format
 *       404:
 *         description: Location not found
 *       500:
 *         description: Internal server error
 */
router.patch('/:id/restore', locationController.restoreLocation);

module.exports = router;
