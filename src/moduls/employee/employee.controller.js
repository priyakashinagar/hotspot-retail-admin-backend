const Employee = require('./employee.model');
const mongoose = require('mongoose');

// Get all employees
exports.getAllEmployees = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            search = '',
            department = '',
            isActive = '',
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        const pageNumber = parseInt(page);
        const limitNumber = parseInt(limit);
        const skip = (pageNumber - 1) * limitNumber;

        // Build filter object
        const filter = {};
        
        if (search) {
            filter.$or = [
                { fullName: { $regex: search, $options: 'i' } },
                { employeeId: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { position: { $regex: search, $options: 'i' } }
            ];
        }

        if (department) {
            filter.department = { $regex: department, $options: 'i' };
        }

        if (isActive !== '') {
            filter.isActive = isActive === 'true';
        }

        // Build sort object
        const sort = {};
        sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

        const employees = await Employee.find(filter)
            .sort(sort)
            .skip(skip)
            .limit(limitNumber)
            .select('-__v');

        const total = await Employee.countDocuments(filter);
        const totalPages = Math.ceil(total / limitNumber);

        res.status(200).json({
            success: true,
            message: 'Employees retrieved successfully',
            data: {
                employees,
                pagination: {
                    currentPage: pageNumber,
                    totalPages,
                    totalItems: total,
                    itemsPerPage: limitNumber,
                    hasNextPage: pageNumber < totalPages,
                    hasPrevPage: pageNumber > 1
                }
            }
        });
    } catch (error) {
        console.error('Get all employees error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Get employee by ID
exports.getEmployeeById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid employee ID format'
            });
        }

        const employee = await Employee.findById(id).select('-__v');

        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Employee retrieved successfully',
            data: employee
        });
    } catch (error) {
        console.error('Get employee by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Create new employee
exports.createEmployee = async (req, res) => {
    try {
        const employeeData = req.body;

        // Check if employee ID already exists
        const existingEmployeeId = await Employee.findOne({ employeeId: employeeData.employeeId });
        if (existingEmployeeId) {
            return res.status(400).json({
                success: false,
                message: 'Employee ID already exists'
            });
        }

        // Check if email already exists
        const existingEmail = await Employee.findOne({ email: employeeData.email });
        if (existingEmail) {
            return res.status(400).json({
                success: false,
                message: 'Email already exists'
            });
        }

        const employee = new Employee(employeeData);
        await employee.save();

        res.status(201).json({
            success: true,
            message: 'Employee created successfully',
            data: employee
        });
    } catch (error) {
        console.error('Create employee error:', error);
        
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors
            });
        }

        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Update employee
exports.updateEmployee = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid employee ID format'
            });
        }

        // Check if employee exists
        const existingEmployee = await Employee.findById(id);
        if (!existingEmployee) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found'
            });
        }

        // Check if employeeId is being updated and already exists
        if (updateData.employeeId && updateData.employeeId !== existingEmployee.employeeId) {
            const existingEmployeeId = await Employee.findOne({ 
                employeeId: updateData.employeeId,
                _id: { $ne: id }
            });
            if (existingEmployeeId) {
                return res.status(400).json({
                    success: false,
                    message: 'Employee ID already exists'
                });
            }
        }

        // Check if email is being updated and already exists
        if (updateData.email && updateData.email !== existingEmployee.email) {
            const existingEmail = await Employee.findOne({ 
                email: updateData.email,
                _id: { $ne: id }
            });
            if (existingEmail) {
                return res.status(400).json({
                    success: false,
                    message: 'Email already exists'
                });
            }
        }

        const employee = await Employee.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        ).select('-__v');

        res.status(200).json({
            success: true,
            message: 'Employee updated successfully',
            data: employee
        });
    } catch (error) {
        console.error('Update employee error:', error);
        
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors
            });
        }

        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Delete employee (soft delete)
exports.deleteEmployee = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid employee ID format'
            });
        }

        const employee = await Employee.findById(id);
        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found'
            });
        }

        // Soft delete by setting isActive to false
        employee.isActive = false;
        await employee.save();

        res.status(200).json({
            success: true,
            message: 'Employee deleted successfully'
        });
    } catch (error) {
        console.error('Delete employee error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Permanently delete employee
exports.permanentDeleteEmployee = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid employee ID format'
            });
        }

        const employee = await Employee.findByIdAndDelete(id);
        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Employee permanently deleted successfully'
        });
    } catch (error) {
        console.error('Permanent delete employee error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Restore employee (activate)
exports.restoreEmployee = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid employee ID format'
            });
        }

        const employee = await Employee.findById(id);
        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found'
            });
        }

        employee.isActive = true;
        await employee.save();

        res.status(200).json({
            success: true,
            message: 'Employee restored successfully',
            data: employee
        });
    } catch (error) {
        console.error('Restore employee error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Get employee statistics
exports.getEmployeeStats = async (req, res) => {
    try {
        const totalEmployees = await Employee.countDocuments();
        const activeEmployees = await Employee.countDocuments({ isActive: true });
        const inactiveEmployees = await Employee.countDocuments({ isActive: false });

        // Department-wise count
        const departmentStats = await Employee.aggregate([
            { $match: { isActive: true } },
            { $group: { _id: '$department', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        // Gender-wise count
        const genderStats = await Employee.aggregate([
            { $match: { isActive: true } },
            { $group: { _id: '$gender', count: { $sum: 1 } } }
        ]);

        // Recent joinings (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentJoinings = await Employee.countDocuments({
            joiningDate: { $gte: thirtyDaysAgo },
            isActive: true
        });

        res.status(200).json({
            success: true,
            message: 'Employee statistics retrieved successfully',
            data: {
                overview: {
                    total: totalEmployees,
                    active: activeEmployees,
                    inactive: inactiveEmployees,
                    recentJoinings
                },
                departmentWise: departmentStats,
                genderWise: genderStats
            }
        });
    } catch (error) {
        console.error('Get employee stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Search employees by employee ID
exports.searchByEmployeeId = async (req, res) => {
    try {
        const { employeeId } = req.params;

        const employee = await Employee.findOne({ employeeId }).select('-__v');

        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found with this Employee ID'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Employee found successfully',
            data: employee
        });
    } catch (error) {
        console.error('Search by employee ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};
