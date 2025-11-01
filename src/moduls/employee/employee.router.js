const express = require('express');
const router = express.Router();
const employeeController = require('./employee.controller');
const auth = require('../../middleware/auth.middleware');

/**
 * @swagger
 * components:
 *   schemas:
 *     Employee:
 *       type: object
 *       required:
 *         - fullName
 *         - employeeId
 *         - email
 *         - mobileNumber
 *         - position
 *         - department
 *         - salary
 *         - joiningDate
 *         - dateOfBirth
 *         - gender
 *       properties:
 *         _id:
 *           type: string
 *           description: Unique identifier for the employee
 *         fullName:
 *           type: string
 *           description: Full name of the employee
 *           example: "John Doe"
 *         employeeId:
 *           type: string
 *           description: Unique employee ID
 *           example: "EMP001"
 *         email:
 *           type: string
 *           format: email
 *           description: Employee email address
 *           example: "john.doe@company.com"
 *         mobileNumber:
 *           type: string
 *           description: Employee mobile number
 *           example: "+919876543210"
 *         position:
 *           type: string
 *           description: Job position
 *           example: "Software Developer"
 *         department:
 *           type: string
 *           description: Department name
 *           example: "IT"
 *         salary:
 *           type: number
 *           description: Monthly salary
 *           example: 50000
 *         joiningDate:
 *           type: string
 *           format: date
 *           description: Date of joining
 *           example: "2024-01-15"
 *         dateOfBirth:
 *           type: string
 *           format: date
 *           description: Date of birth
 *           example: "1990-05-20"
 *         gender:
 *           type: string
 *           enum: [Male, Female, Other]
 *           description: Gender
 *           example: "Male"
 *         experienceYears:
 *           type: number
 *           description: Years of experience
 *           example: 5
 *         qualification:
 *           type: string
 *           description: Educational qualification
 *           example: "B.Tech Computer Science"
 *         skills:
 *           type: array
 *           items:
 *             type: string
 *           description: List of skills
 *           example: ["JavaScript", "Node.js", "React"]
 *         address:
 *           type: object
 *           properties:
 *             street:
 *               type: string
 *               example: "123 Main Street"
 *             city:
 *               type: string
 *               example: "Mumbai"
 *             state:
 *               type: string
 *               example: "Maharashtra"
 *             pincode:
 *               type: string
 *               example: "400001"
 *         emergencyContact:
 *           type: object
 *           properties:
 *             name:
 *               type: string
 *               example: "Jane Doe"
 *             phone:
 *               type: string
 *               example: "+919876543211"
 *         notes:
 *           type: string
 *           description: Additional notes
 *           example: "Good performer"
 *         isActive:
 *           type: boolean
 *           description: Employee status
 *           example: true
 *         profileImage:
 *           type: string
 *           description: Profile image URL
 *           example: null
 *         age:
 *           type: number
 *           description: Calculated age
 *           example: 34
 *         fullAddress:
 *           type: string
 *           description: Complete address
 *           example: "123 Main Street, Mumbai, Maharashtra - 400001"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 * 
 *     EmployeeInput:
 *       type: object
 *       required:
 *         - fullName
 *         - employeeId
 *         - email
 *         - mobileNumber
 *         - position
 *         - department
 *         - salary
 *         - joiningDate
 *         - dateOfBirth
 *         - gender
 *       properties:
 *         fullName:
 *           type: string
 *           example: "John Doe"
 *         employeeId:
 *           type: string
 *           example: "EMP001"
 *         email:
 *           type: string
 *           format: email
 *           example: "john.doe@company.com"
 *         mobileNumber:
 *           type: string
 *           example: "+919876543210"
 *         position:
 *           type: string
 *           example: "Software Developer"
 *         department:
 *           type: string
 *           example: "IT"
 *         salary:
 *           type: number
 *           example: 50000
 *         joiningDate:
 *           type: string
 *           format: date
 *           example: "2024-01-15"
 *         dateOfBirth:
 *           type: string
 *           format: date
 *           example: "1990-05-20"
 *         gender:
 *           type: string
 *           enum: [Male, Female, Other]
 *           example: "Male"
 *         experienceYears:
 *           type: number
 *           example: 5
 *         qualification:
 *           type: string
 *           example: "B.Tech Computer Science"
 *         skills:
 *           type: array
 *           items:
 *             type: string
 *           example: ["JavaScript", "Node.js", "React"]
 *         address:
 *           type: object
 *           properties:
 *             street:
 *               type: string
 *               example: "123 Main Street"
 *             city:
 *               type: string
 *               example: "Mumbai"
 *             state:
 *               type: string
 *               example: "Maharashtra"
 *             pincode:
 *               type: string
 *               example: "400001"
 *         emergencyContact:
 *           type: object
 *           properties:
 *             name:
 *               type: string
 *               example: "Jane Doe"
 *             phone:
 *               type: string
 *               example: "+919876543211"
 *         notes:
 *           type: string
 *           example: "Good performer"
 */

/**
 * @swagger
 * /api/employees:
 *   get:
 *     summary: Get all employees with pagination and filtering
 *     tags: [Employees]
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
 *         description: Number of employees per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name, employee ID, email, or position
 *       - in: query
 *         name: department
 *         schema:
 *           type: string
 *         description: Filter by department
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: string
 *           enum: [true, false]
 *         description: Filter by active status
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
 *         description: Employees retrieved successfully
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
 *                   example: "Employees retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     employees:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Employee'
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
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/', auth, employeeController.getAllEmployees);

/**
 * @swagger
 * /api/employees/stats:
 *   get:
 *     summary: Get employee statistics
 *     tags: [Employees]
 *     responses:
 *       200:
 *         description: Employee statistics retrieved successfully
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
 *                   example: "Employee statistics retrieved successfully"
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
 *                         recentJoinings:
 *                           type: integer
 *                     departmentWise:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           count:
 *                             type: integer
 *                     genderWise:
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
router.get('/stats', auth, employeeController.getEmployeeStats);

/**
 * @swagger
 * /api/employees/search/{employeeId}:
 *   get:
 *     summary: Search employee by employee ID
 *     tags: [Employees]
 *     parameters:
 *       - in: path
 *         name: employeeId
 *         required: true
 *         schema:
 *           type: string
 *         description: Employee ID to search for
 *     responses:
 *       200:
 *         description: Employee found successfully
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
 *                   example: "Employee found successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Employee'
 *       404:
 *         description: Employee not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 */
router.get('/search/:employeeId', auth, employeeController.searchByEmployeeId);

/**
 * @swagger
 * /api/employees/{id}:
 *   get:
 *     summary: Get employee by ID
 *     tags: [Employees]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Employee MongoDB ObjectId
 *     responses:
 *       200:
 *         description: Employee retrieved successfully
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
 *                   example: "Employee retrieved successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Employee'
 *       400:
 *         description: Invalid employee ID format
 *       404:
 *         description: Employee not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id', auth, employeeController.getEmployeeById);

/**
 * @swagger
 * /api/employees:
 *   post:
 *     summary: Create a new employee
 *     tags: [Employees]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EmployeeInput'
 *     responses:
 *       201:
 *         description: Employee created successfully
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
 *                   example: "Employee created successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Employee'
 *       400:
 *         description: Validation error or employee already exists
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
router.post('/', auth, employeeController.createEmployee);

/**
 * @swagger
 * /api/employees/{id}:
 *   put:
 *     summary: Update employee by ID
 *     tags: [Employees]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Employee MongoDB ObjectId
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EmployeeInput'
 *     responses:
 *       200:
 *         description: Employee updated successfully
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
 *                   example: "Employee updated successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Employee'
 *       400:
 *         description: Invalid employee ID format or validation error
 *       404:
 *         description: Employee not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id', auth, employeeController.updateEmployee);

/**
 * @swagger
 * /api/employees/{id}:
 *   delete:
 *     summary: Soft delete employee (deactivate)
 *     tags: [Employees]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Employee MongoDB ObjectId
 *     responses:
 *       200:
 *         description: Employee deleted successfully
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
 *                   example: "Employee deleted successfully"
 *       400:
 *         description: Invalid employee ID format
 *       404:
 *         description: Employee not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', auth, employeeController.deleteEmployee);

/**
 * @swagger
 * /api/employees/{id}/permanent:
 *   delete:
 *     summary: Permanently delete employee
 *     tags: [Employees]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Employee MongoDB ObjectId
 *     responses:
 *       200:
 *         description: Employee permanently deleted successfully
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
 *                   example: "Employee permanently deleted successfully"
 *       400:
 *         description: Invalid employee ID format
 *       404:
 *         description: Employee not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id/permanent', auth, employeeController.permanentDeleteEmployee);

/**
 * @swagger
 * /api/employees/{id}/restore:
 *   patch:
 *     summary: Restore employee (activate)
 *     tags: [Employees]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Employee MongoDB ObjectId
 *     responses:
 *       200:
 *         description: Employee restored successfully
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
 *                   example: "Employee restored successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Employee'
 *       400:
 *         description: Invalid employee ID format
 *       404:
 *         description: Employee not found
 *       500:
 *         description: Internal server error
 */
router.patch('/:id/restore', auth, employeeController.restoreEmployee);

/**
 * @swagger
 * /api/employees/search:
 *   get:
 *     summary: Search employees with advanced filters
 *     tags: [Employees]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search query for name, email, employeeId, or mobile
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
 *         description: Number of employees per page
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [fullName, email, createdAt, updatedAt, department, position, salary]
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
 *         name: department
 *         schema:
 *           type: string
 *         description: Filter by department
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *       - in: query
 *         name: position
 *         schema:
 *           type: string
 *         description: Filter by position
 *       - in: query
 *         name: salaryMin
 *         schema:
 *           type: integer
 *         description: Minimum salary filter
 *       - in: query
 *         name: salaryMax
 *         schema:
 *           type: integer
 *         description: Maximum salary filter
 *     responses:
 *       200:
 *         description: Search completed successfully
 */
router.get('/search', auth, employeeController.searchEmployees);

/**
 * @swagger
 * /api/employees/dropdown/departments:
 *   get:
 *     summary: Get all unique departments
 *     tags: [Employees]
 *     responses:
 *       200:
 *         description: Departments retrieved successfully
 */
router.get('/dropdown/departments', auth, employeeController.getAllDepartments);

/**
 * @swagger
 * /api/employees/dropdown/positions:
 *   get:
 *     summary: Get all unique positions
 *     tags: [Employees]
 *     responses:
 *       200:
 *         description: Positions retrieved successfully
 */
router.get('/dropdown/positions', auth, employeeController.getAllPositions);

/**
 * @swagger
 * /api/employees/dropdown/cities:
 *   get:
 *     summary: Get all unique cities
 *     tags: [Employees]
 *     responses:
 *       200:
 *         description: Cities retrieved successfully
 */
router.get('/dropdown/cities', auth, employeeController.getAllCities);

/**
 * @swagger
 * /api/employees/dropdown/states:
 *   get:
 *     summary: Get all unique states
 *     tags: [Employees]
 *     responses:
 *       200:
 *         description: States retrieved successfully
 */
router.get('/dropdown/states', auth, employeeController.getAllStates);

/**
 * @swagger
 * /api/employees/dropdown/qualifications:
 *   get:
 *     summary: Get all unique qualifications
 *     tags: [Employees]
 *     responses:
 *       200:
 *         description: Qualifications retrieved successfully
 */
router.get('/dropdown/qualifications', auth, employeeController.getAllQualifications);

/**
 * @swagger
 * /api/employees/dropdown/skills:
 *   get:
 *     summary: Get all unique skills
 *     tags: [Employees]
 *     responses:
 *       200:
 *         description: Skills retrieved successfully
 */
router.get('/dropdown/skills', auth, employeeController.getAllSkills);

/**
 * @swagger
 * /api/employees/dropdown/genders:
 *   get:
 *     summary: Get gender options
 *     tags: [Employees]
 *     responses:
 *       200:
 *         description: Gender options retrieved successfully
 */
router.get('/dropdown/genders', auth, employeeController.getGenderOptions);

/**
 * @swagger
 * /api/employees/dropdown/departments:
 *   post:
 *     summary: Add new department
 *     tags: [Employees]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - department
 *             properties:
 *               department:
 *                 type: string
 *                 description: Department name
 *     responses:
 *       200:
 *         description: Department validated successfully
 */
router.post('/dropdown/departments', auth, employeeController.addDepartment);

/**
 * @swagger
 * /api/employees/dropdown/positions:
 *   post:
 *     summary: Add new position
 *     tags: [Employees]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - position
 *             properties:
 *               position:
 *                 type: string
 *                 description: Position name
 *     responses:
 *       200:
 *         description: Position validated successfully
 */
router.post('/dropdown/positions', auth, employeeController.addPosition);

/**
 * @swagger
 * /api/employees/dropdown/cities:
 *   post:
 *     summary: Add new city
 *     tags: [Employees]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - city
 *             properties:
 *               city:
 *                 type: string
 *                 description: City name
 *     responses:
 *       200:
 *         description: City validated successfully
 */
router.post('/dropdown/cities', auth, employeeController.addCity);

/**
 * @swagger
 * /api/employees/dropdown/states:
 *   post:
 *     summary: Add new state
 *     tags: [Employees]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - state
 *             properties:
 *               state:
 *                 type: string
 *                 description: State name
 *     responses:
 *       200:
 *         description: State validated successfully
 */
router.post('/dropdown/states', auth, employeeController.addState);

/**
 * @swagger
 * /api/employees/dropdown/qualifications:
 *   post:
 *     summary: Add new qualification
 *     tags: [Employees]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - qualification
 *             properties:
 *               qualification:
 *                 type: string
 *                 description: Qualification name
 *     responses:
 *       200:
 *         description: Qualification validated successfully
 */
router.post('/dropdown/qualifications', auth, employeeController.addQualification);

/**
 * @swagger
 * /api/employees/dropdown/skills:
 *   post:
 *     summary: Add new skill
 *     tags: [Employees]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - skill
 *             properties:
 *               skill:
 *                 type: string
 *                 description: Skill name
 *     responses:
 *       200:
 *         description: Skill validated successfully
 */
router.post('/dropdown/skills', auth, employeeController.addSkill);

/**
 * @swagger
 * /api/employees/bulk/delete:
 *   post:
 *     summary: Bulk delete employees
 *     tags: [Employees]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ids
 *             properties:
 *               ids:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of employee IDs to delete
 *     responses:
 *       200:
 *         description: Employees deleted successfully
 */
router.post('/bulk/delete', auth, employeeController.bulkDeleteEmployees);

/**
 * @swagger
 * /api/employees/bulk/update-department:
 *   post:
 *     summary: Bulk update employee department
 *     tags: [Employees]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ids
 *               - department
 *             properties:
 *               ids:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of employee IDs to update
 *               department:
 *                 type: string
 *                 description: New department name
 *     responses:
 *       200:
 *         description: Employees updated successfully
 */
router.post('/bulk/update-department', auth, employeeController.bulkUpdateDepartment);

/**
 * @swagger
 * /api/employees/bulk/update-status:
 *   post:
 *     summary: Bulk update employee status
 *     tags: [Employees]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ids
 *               - isActive
 *             properties:
 *               ids:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of employee IDs to update
 *               isActive:
 *                 type: boolean
 *                 description: New status (true for active, false for inactive)
 *     responses:
 *       200:
 *         description: Employees updated successfully
 */
router.post('/bulk/update-status', auth, employeeController.bulkUpdateStatus);

module.exports = router;
