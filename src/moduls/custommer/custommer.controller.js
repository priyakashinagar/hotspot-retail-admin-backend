const Customer = require('./custommer.model');
const mongoose = require('mongoose');

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

// Create a new customer
const createCustomer = async (req, res) => {
    try {
        const {
            fullName,
            email,
            mobileNumber,
            gender,
            address,
            city,
            state,
            pincode,
            dateOfBirth,
            membership,
            notes
        } = req.body;

        // Check if customer already exists
        const existingCustomer = await Customer.findOne({
            $or: [
                { email: email.toLowerCase() },
                { mobileNumber: mobileNumber }
            ]
        });

        if (existingCustomer) {
            return sendErrorResponse(res, 409, 'Customer already exists with this email or mobile number');
        }

        // Create new customer
        const customer = new Customer({
            fullName,
            email,
            mobileNumber,
            gender,
            address,
            city,
            state,
            pincode,
            dateOfBirth,
            membership: membership || 'Regular',
            notes: notes || ''
        });

        const savedCustomer = await customer.save();
        
        return sendSuccessResponse(res, 201, 'Customer created successfully', savedCustomer);
    } catch (error) {
        console.error('Create customer error:', error);
        
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

// Get all customers with pagination and filters
const getAllCustomers = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            search = '',
            sortBy = 'createdAt',
            sortOrder = 'desc',
            membership = '',
            isActive = '',
            city = '',
            state = ''
        } = req.query;

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        // Build query object
        const query = {};
        
        if (search) {
            query.$or = [
                { fullName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { mobileNumber: { $regex: search, $options: 'i' } }
            ];
        }
        
        if (membership) query.membership = membership;
        if (isActive !== '') query.isActive = isActive === 'true';
        if (city) query.city = { $regex: city, $options: 'i' };
        if (state) query.state = { $regex: state, $options: 'i' };

        // Build sort object
        const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

        // Get customers with pagination
        const customers = await Customer.find(query)
            .sort(sort)
            .skip(skip)
            .limit(limitNum)
            .lean();

        // Get total count for pagination
        const totalCustomers = await Customer.countDocuments(query);
        const totalPages = Math.ceil(totalCustomers / limitNum);

        const response = {
            customers,
            pagination: {
                currentPage: pageNum,
                totalPages,
                totalCustomers,
                hasNextPage: pageNum < totalPages,
                hasPrevPage: pageNum > 1,
                limit: limitNum
            }
        };

        return sendSuccessResponse(res, 200, 'Customers retrieved successfully', response);
    } catch (error) {
        console.error('Get all customers error:', error);
        return sendErrorResponse(res, 500, 'Internal server error');
    }
};

// Get customer by ID
const getCustomerById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return sendErrorResponse(res, 400, 'Invalid customer ID');
        }

        const customer = await Customer.findById(id);

        if (!customer) {
            return sendErrorResponse(res, 404, 'Customer not found');
        }

        return sendSuccessResponse(res, 200, 'Customer retrieved successfully', customer);
    } catch (error) {
        console.error('Get customer by ID error:', error);
        return sendErrorResponse(res, 500, 'Internal server error');
    }
};

// Update customer
const updateCustomer = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return sendErrorResponse(res, 400, 'Invalid customer ID');
        }

        // Check if customer exists
        const existingCustomer = await Customer.findById(id);
        if (!existingCustomer) {
            return sendErrorResponse(res, 404, 'Customer not found');
        }

        // Check for duplicate email or mobile number (exclude current customer)
        if (updateData.email || updateData.mobileNumber) {
            const duplicateQuery = {
                _id: { $ne: id },
                $or: []
            };

            if (updateData.email) {
                duplicateQuery.$or.push({ email: updateData.email.toLowerCase() });
            }
            if (updateData.mobileNumber) {
                duplicateQuery.$or.push({ mobileNumber: updateData.mobileNumber });
            }

            const duplicateCustomer = await Customer.findOne(duplicateQuery);
            if (duplicateCustomer) {
                return sendErrorResponse(res, 409, 'Another customer already exists with this email or mobile number');
            }
        }

        // Update customer
        const updatedCustomer = await Customer.findByIdAndUpdate(
            id,
            { $set: updateData },
            { 
                new: true, 
                runValidators: true 
            }
        );

        return sendSuccessResponse(res, 200, 'Customer updated successfully', updatedCustomer);
    } catch (error) {
        console.error('Update customer error:', error);
        
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            return sendErrorResponse(res, 400, 'Validation failed', errors);
        }
        
        return sendErrorResponse(res, 500, 'Internal server error');
    }
};

// Delete customer
const deleteCustomer = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return sendErrorResponse(res, 400, 'Invalid customer ID');
        }

        const customer = await Customer.findById(id);
        if (!customer) {
            return sendErrorResponse(res, 404, 'Customer not found');
        }

        await Customer.findByIdAndDelete(id);

        return sendSuccessResponse(res, 200, 'Customer deleted successfully');
    } catch (error) {
        console.error('Delete customer error:', error);
        return sendErrorResponse(res, 500, 'Internal server error');
    }
};

// Soft delete customer (deactivate)
const deactivateCustomer = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return sendErrorResponse(res, 400, 'Invalid customer ID');
        }

        const customer = await Customer.findByIdAndUpdate(
            id,
            { $set: { isActive: false } },
            { new: true }
        );

        if (!customer) {
            return sendErrorResponse(res, 404, 'Customer not found');
        }

        return sendSuccessResponse(res, 200, 'Customer deactivated successfully', customer);
    } catch (error) {
        console.error('Deactivate customer error:', error);
        return sendErrorResponse(res, 500, 'Internal server error');
    }
};

// Activate customer
const activateCustomer = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return sendErrorResponse(res, 400, 'Invalid customer ID');
        }

        const customer = await Customer.findByIdAndUpdate(
            id,
            { $set: { isActive: true } },
            { new: true }
        );

        if (!customer) {
            return sendErrorResponse(res, 404, 'Customer not found');
        }

        return sendSuccessResponse(res, 200, 'Customer activated successfully', customer);
    } catch (error) {
        console.error('Activate customer error:', error);
        return sendErrorResponse(res, 500, 'Internal server error');
    }
};

// Search customers with advanced filters
const searchCustomers = async (req, res) => {
    try {
        const {
            q = '',
            page = 1,
            limit = 10,
            sortBy = 'createdAt',
            sortOrder = 'desc',
            membership = null,
            isActive = null,
            city = null,
            state = null,
            ageMin = null,
            ageMax = null
        } = req.query;

        const options = {
            page: parseInt(page),
            limit: parseInt(limit),
            sortBy,
            sortOrder,
            membership,
            isActive: isActive !== null ? isActive === 'true' : null,
            city,
            state
        };

        let customers = await Customer.searchCustomers(q, options);

        // Filter by age if specified
        if (ageMin !== null || ageMax !== null) {
            customers = customers.filter(customer => {
                const age = customer.age;
                if (ageMin !== null && age < parseInt(ageMin)) return false;
                if (ageMax !== null && age > parseInt(ageMax)) return false;
                return true;
            });
        }

        // Get total count for pagination
        const totalQuery = {};
        if (q) {
            totalQuery.$or = [
                { fullName: { $regex: q, $options: 'i' } },
                { email: { $regex: q, $options: 'i' } },
                { mobileNumber: { $regex: q, $options: 'i' } }
            ];
        }
        if (membership) totalQuery.membership = membership;
        if (isActive !== null) totalQuery.isActive = isActive === 'true';
        if (city) totalQuery.city = { $regex: city, $options: 'i' };
        if (state) totalQuery.state = { $regex: state, $options: 'i' };

        const totalCustomers = await Customer.countDocuments(totalQuery);
        const totalPages = Math.ceil(totalCustomers / options.limit);

        const response = {
            customers,
            pagination: {
                currentPage: options.page,
                totalPages,
                totalCustomers,
                hasNextPage: options.page < totalPages,
                hasPrevPage: options.page > 1,
                limit: options.limit
            },
            filters: {
                searchTerm: q,
                membership,
                isActive,
                city,
                state,
                ageMin,
                ageMax
            }
        };

        return sendSuccessResponse(res, 200, 'Search completed successfully', response);
    } catch (error) {
        console.error('Search customers error:', error);
        return sendErrorResponse(res, 500, 'Internal server error');
    }
};

// Get customer statistics
const getCustomerStats = async (req, res) => {
    try {
        const totalCustomers = await Customer.countDocuments();
        const activeCustomers = await Customer.countDocuments({ isActive: true });
        const inactiveCustomers = await Customer.countDocuments({ isActive: false });

        // Membership distribution
        const membershipStats = await Customer.aggregate([
            {
                $group: {
                    _id: '$membership',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Gender distribution
        const genderStats = await Customer.aggregate([
            {
                $group: {
                    _id: '$gender',
                    count: { $sum: 1 }
                }
            }
        ]);

        // City-wise distribution (top 10)
        const cityStats = await Customer.aggregate([
            {
                $group: {
                    _id: '$city',
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);

        // Recent customers (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentCustomers = await Customer.countDocuments({
            createdAt: { $gte: thirtyDaysAgo }
        });

        const stats = {
            total: totalCustomers,
            active: activeCustomers,
            inactive: inactiveCustomers,
            recent: recentCustomers,
            membershipDistribution: membershipStats,
            genderDistribution: genderStats,
            topCities: cityStats
        };

        return sendSuccessResponse(res, 200, 'Customer statistics retrieved successfully', stats);
    } catch (error) {
        console.error('Get customer stats error:', error);
        return sendErrorResponse(res, 500, 'Internal server error');
    }
};

// Get all unique cities
const getAllCities = async (req, res) => {
    try {
        const cities = await Customer.distinct('city');
        return sendSuccessResponse(res, 200, 'Cities retrieved successfully', cities.filter(city => city));
    } catch (error) {
        console.error('Get cities error:', error);
        return sendErrorResponse(res, 500, 'Internal server error');
    }
};

// Get all unique states
const getAllStates = async (req, res) => {
    try {
        const states = await Customer.distinct('state');
        return sendSuccessResponse(res, 200, 'States retrieved successfully', states.filter(state => state));
    } catch (error) {
        console.error('Get states error:', error);
        return sendErrorResponse(res, 500, 'Internal server error');
    }
};

// Get membership types
const getMembershipTypes = async (req, res) => {
    try {
        const membershipTypes = ['Regular', 'Premium', 'VIP', 'Gold', 'Silver', 'Bronze', 'Platinum'];
        return sendSuccessResponse(res, 200, 'Membership types retrieved successfully', membershipTypes);
    } catch (error) {
        console.error('Get membership types error:', error);
        return sendErrorResponse(res, 500, 'Internal server error');
    }
};

// Bulk delete customers
const bulkDeleteCustomers = async (req, res) => {
    try {
        const { ids } = req.body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return sendErrorResponse(res, 400, 'Please provide an array of customer IDs');
        }

        // Validate all IDs
        const invalidIds = ids.filter(id => !mongoose.Types.ObjectId.isValid(id));
        if (invalidIds.length > 0) {
            return sendErrorResponse(res, 400, 'Invalid customer IDs provided');
        }

        const result = await Customer.deleteMany({ _id: { $in: ids } });

        return sendSuccessResponse(res, 200, `${result.deletedCount} customers deleted successfully`, { deletedCount: result.deletedCount });
    } catch (error) {
        console.error('Bulk delete customers error:', error);
        return sendErrorResponse(res, 500, 'Internal server error');
    }
};

// Bulk update membership
const bulkUpdateMembership = async (req, res) => {
    try {
        const { ids, membership } = req.body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return sendErrorResponse(res, 400, 'Please provide an array of customer IDs');
        }

        if (!membership) {
            return sendErrorResponse(res, 400, 'Please provide membership type');
        }

        const validMemberships = ['Regular', 'Premium', 'VIP', 'Gold', 'Silver', 'Bronze', 'Platinum'];
        if (!validMemberships.includes(membership)) {
            return sendErrorResponse(res, 400, 'Invalid membership type');
        }

        // Validate all IDs
        const invalidIds = ids.filter(id => !mongoose.Types.ObjectId.isValid(id));
        if (invalidIds.length > 0) {
            return sendErrorResponse(res, 400, 'Invalid customer IDs provided');
        }

        const result = await Customer.updateMany(
            { _id: { $in: ids } },
            { $set: { membership: membership } }
        );

        return sendSuccessResponse(res, 200, `${result.modifiedCount} customers updated successfully`, { modifiedCount: result.modifiedCount });
    } catch (error) {
        console.error('Bulk update membership error:', error);
        return sendErrorResponse(res, 500, 'Internal server error');
    }
};

module.exports = {
    createCustomer,
    getAllCustomers,
    getCustomerById,
    updateCustomer,
    deleteCustomer,
    deactivateCustomer,
    activateCustomer,
    searchCustomers,
    getCustomerStats,
    getAllCities,
    getAllStates,
    getMembershipTypes,
    bulkDeleteCustomers,
    bulkUpdateMembership
};
