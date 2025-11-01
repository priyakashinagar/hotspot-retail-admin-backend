const Employee = require('./employee.model');
const mongoose = require('mongoose');
const dropdownData = require('./dropdownData');

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

// Advanced search employees
exports.searchEmployees = async (req, res) => {
    try {
        const {
            q = '',
            page = 1,
            limit = 10,
            sortBy = 'createdAt',
            sortOrder = 'desc',
            department = null,
            isActive = null,
            position = null,
            salaryMin = null,
            salaryMax = null
        } = req.query;

        const pageNumber = parseInt(page);
        const limitNumber = parseInt(limit);
        const skip = (pageNumber - 1) * limitNumber;

        // Build query object
        const query = {};
        
        if (q) {
            query.$or = [
                { fullName: { $regex: q, $options: 'i' } },
                { email: { $regex: q, $options: 'i' } },
                { employeeId: { $regex: q, $options: 'i' } },
                { mobileNumber: { $regex: q, $options: 'i' } }
            ];
        }
        
        if (department) query.department = { $regex: department, $options: 'i' };
        if (isActive !== null) query.isActive = isActive === 'true';
        if (position) query.position = { $regex: position, $options: 'i' };
        if (salaryMin !== null) query.salary = { $gte: parseInt(salaryMin) };
        if (salaryMax !== null) query.salary = { ...query.salary, $lte: parseInt(salaryMax) };

        // Build sort object
        const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

        // Get employees with pagination
        const employees = await Employee.find(query)
            .sort(sort)
            .skip(skip)
            .limit(limitNumber)
            .select('-__v');

        // Get total count for pagination
        const totalEmployees = await Employee.countDocuments(query);
        const totalPages = Math.ceil(totalEmployees / limitNumber);

        const response = {
            employees,
            pagination: {
                currentPage: pageNumber,
                totalPages,
                totalEmployees,
                hasNextPage: pageNumber < totalPages,
                hasPrevPage: pageNumber > 1,
                limit: limitNumber
            },
            filters: {
                searchTerm: q,
                department,
                isActive,
                position,
                salaryMin,
                salaryMax
            }
        };

        res.status(200).json({
            success: true,
            message: 'Search completed successfully',
            data: response
        });
    } catch (error) {
        console.error('Search employees error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Get all unique departments
exports.getAllDepartments = async (req, res) => {
    try {
        console.log('📋 Getting all departments from in-memory storage');
        res.status(200).json({
            success: true,
            message: 'Departments retrieved successfully',
            data: dropdownData.departments
        });
    } catch (error) {
        console.error('Get departments error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Get all unique positions
exports.getAllPositions = async (req, res) => {
    try {
        console.log('📋 Getting all positions from in-memory storage');
        res.status(200).json({
            success: true,
            message: 'Positions retrieved successfully',
            data: dropdownData.positions
        });
    } catch (error) {
        console.error('Get positions error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Get all unique cities
exports.getAllCities = async (req, res) => {
    try {
        console.log('📋 Getting all cities from in-memory storage');
        res.status(200).json({
            success: true,
            message: 'Cities retrieved successfully',
            data: dropdownData.cities
        });
    } catch (error) {
        console.error('Get cities error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Get all unique states
exports.getAllStates = async (req, res) => {
    try {
        console.log('📋 Getting all states from in-memory storage');
        res.status(200).json({
            success: true,
            message: 'States retrieved successfully',
            data: dropdownData.states
        });
    } catch (error) {
        console.error('Get states error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Get all unique qualifications
exports.getAllQualifications = async (req, res) => {
    try {
        console.log('📋 Getting all qualifications from in-memory storage');
        res.status(200).json({
            success: true,
            message: 'Qualifications retrieved successfully',
            data: dropdownData.qualifications
        });
    } catch (error) {
        console.error('Get qualifications error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Get all unique skills
exports.getAllSkills = async (req, res) => {
    try {
        console.log('📋 Getting all skills from in-memory storage');
        res.status(200).json({
            success: true,
            message: 'Skills retrieved successfully',
            data: dropdownData.skills
        });
    } catch (error) {
        console.error('Get skills error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Get gender options (static)
exports.getGenderOptions = async (req, res) => {
    try {
        const genders = ['Male', 'Female', 'Other'];
        res.status(200).json({
            success: true,
            message: 'Gender options retrieved successfully',
            data: genders
        });
    } catch (error) {
        console.error('Get gender options error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Add new department
exports.addDepartment = async (req, res) => {
    try {
        const { department } = req.body;

        if (!department || !department.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Department name is required'
            });
        }

        const trimmedDept = department.trim();
        
        // Check if department already exists (case-insensitive)
        const exists = dropdownData.departments.some(
            d => d.toLowerCase() === trimmedDept.toLowerCase()
        );

        if (exists) {
            return res.status(400).json({
                success: false,
                message: 'Department already exists'
            });
        }

        // Add to in-memory array
        dropdownData.departments.push(trimmedDept);
        console.log('✅ Department added:', trimmedDept);
        console.log('📋 Current departments:', dropdownData.departments);

        res.status(200).json({
            success: true,
            message: 'Department added successfully',
            data: { department: trimmedDept }
        });
    } catch (error) {
        console.error('Add department error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Add new position
exports.addPosition = async (req, res) => {
    try {
        const { position } = req.body;

        if (!position || !position.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Position name is required'
            });
        }

        const trimmedPos = position.trim();
        
        // Check if position already exists (case-insensitive)
        const exists = dropdownData.positions.some(
            p => p.toLowerCase() === trimmedPos.toLowerCase()
        );

        if (exists) {
            return res.status(400).json({
                success: false,
                message: 'Position already exists'
            });
        }

        // Add to in-memory array
        dropdownData.positions.push(trimmedPos);
        console.log('✅ Position added:', trimmedPos);
        console.log('📋 Current positions:', dropdownData.positions);

        res.status(200).json({
            success: true,
            message: 'Position added successfully',
            data: { position: trimmedPos }
        });
    } catch (error) {
        console.error('Add position error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Add new city
exports.addCity = async (req, res) => {
    try {
        const { city } = req.body;

        if (!city || !city.trim()) {
            return res.status(400).json({
                success: false,
                message: 'City name is required'
            });
        }

        const trimmedCity = city.trim();
        
        // Check if city already exists (case-insensitive)
        const exists = dropdownData.cities.some(
            c => c.toLowerCase() === trimmedCity.toLowerCase()
        );

        if (exists) {
            return res.status(400).json({
                success: false,
                message: 'City already exists'
            });
        }

        // Add to in-memory array
        dropdownData.cities.push(trimmedCity);
        console.log('✅ City added:', trimmedCity);

        res.status(200).json({
            success: true,
            message: 'City added successfully',
            data: { city: trimmedCity }
        });
    } catch (error) {
        console.error('Add city error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Add new state
exports.addState = async (req, res) => {
    try {
        const { state } = req.body;

        if (!state || !state.trim()) {
            return res.status(400).json({
                success: false,
                message: 'State name is required'
            });
        }

        const trimmedState = state.trim();
        
        // Check if state already exists (case-insensitive)
        const exists = dropdownData.states.some(
            s => s.toLowerCase() === trimmedState.toLowerCase()
        );

        if (exists) {
            return res.status(400).json({
                success: false,
                message: 'State already exists'
            });
        }

        // Add to in-memory array
        dropdownData.states.push(trimmedState);
        console.log('✅ State added:', trimmedState);

        res.status(200).json({
            success: true,
            message: 'State added successfully',
            data: { state: trimmedState }
        });
    } catch (error) {
        console.error('Add state error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Add new qualification
exports.addQualification = async (req, res) => {
    try {
        const { qualification } = req.body;

        if (!qualification || !qualification.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Qualification name is required'
            });
        }

        const trimmedQual = qualification.trim();
        
        // Check if qualification already exists (case-insensitive)
        const exists = dropdownData.qualifications.some(
            q => q.toLowerCase() === trimmedQual.toLowerCase()
        );

        if (exists) {
            return res.status(400).json({
                success: false,
                message: 'Qualification already exists'
            });
        }

        // Add to in-memory array
        dropdownData.qualifications.push(trimmedQual);
        console.log('✅ Qualification added:', trimmedQual);

        res.status(200).json({
            success: true,
            message: 'Qualification added successfully',
            data: { qualification: trimmedQual }
        });
    } catch (error) {
        console.error('Add qualification error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Add new skill
exports.addSkill = async (req, res) => {
    try {
        const { skill } = req.body;

        if (!skill || !skill.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Skill name is required'
            });
        }

        const trimmedSkill = skill.trim();
        
        // Check if skill already exists (case-insensitive)
        const exists = dropdownData.skills.some(
            s => s.toLowerCase() === trimmedSkill.toLowerCase()
        );

        if (exists) {
            return res.status(400).json({
                success: false,
                message: 'Skill already exists'
            });
        }

        // Add to in-memory array
        dropdownData.skills.push(trimmedSkill);
        console.log('✅ Skill added:', trimmedSkill);

        res.status(200).json({
            success: true,
            message: 'Skill added successfully',
            data: { skill: trimmedSkill }
        });
    } catch (error) {
        console.error('Add skill error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Bulk delete employees
exports.bulkDeleteEmployees = async (req, res) => {
    try {
        const { ids } = req.body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Please provide an array of employee IDs'
            });
        }

        // Validate all IDs
        const invalidIds = ids.filter(id => !mongoose.Types.ObjectId.isValid(id));
        if (invalidIds.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid employee IDs provided'
            });
        }

        const result = await Employee.deleteMany({ _id: { $in: ids } });

        res.status(200).json({
            success: true,
            message: `${result.deletedCount} employees deleted successfully`,
            data: { deletedCount: result.deletedCount }
        });
    } catch (error) {
        console.error('Bulk delete employees error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Bulk update department
exports.bulkUpdateDepartment = async (req, res) => {
    try {
        const { ids, department } = req.body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Please provide an array of employee IDs'
            });
        }

        if (!department) {
            return res.status(400).json({
                success: false,
                message: 'Please provide department name'
            });
        }

        // Validate all IDs
        const invalidIds = ids.filter(id => !mongoose.Types.ObjectId.isValid(id));
        if (invalidIds.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid employee IDs provided'
            });
        }

        const result = await Employee.updateMany(
            { _id: { $in: ids } },
            { $set: { department: department } }
        );

        res.status(200).json({
            success: true,
            message: `${result.modifiedCount} employees updated successfully`,
            data: { modifiedCount: result.modifiedCount }
        });
    } catch (error) {
        console.error('Bulk update department error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Bulk update status
exports.bulkUpdateStatus = async (req, res) => {
    try {
        const { ids, isActive } = req.body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Please provide an array of employee IDs'
            });
        }

        if (typeof isActive !== 'boolean') {
            return res.status(400).json({
                success: false,
                message: 'Please provide valid status (true/false)'
            });
        }

        // Validate all IDs
        const invalidIds = ids.filter(id => !mongoose.Types.ObjectId.isValid(id));
        if (invalidIds.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid employee IDs provided'
            });
        }

        const result = await Employee.updateMany(
            { _id: { $in: ids } },
            { $set: { isActive: isActive } }
        );

        res.status(200).json({
            success: true,
            message: `${result.modifiedCount} employees ${isActive ? 'activated' : 'deactivated'} successfully`,
            data: { modifiedCount: result.modifiedCount }
        });
    } catch (error) {
        console.error('Bulk update status error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};
