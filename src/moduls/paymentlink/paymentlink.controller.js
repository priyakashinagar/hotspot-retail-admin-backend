const PaymentLink = require('./paymentlink.model');
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

// Create a new payment link
const createPaymentLink = async (req, res) => {
    try {
        const {
            title,
            amount,
            currency,
            customerName,
            customerEmail,
            description,
            expiryDate,
            allowPartialPayment,
            sendEmailNotification,
            sendSmsNotification,
            paymentGateway,
            metadata
        } = req.body;

        // Check if payment link with same title already exists for this user
        const existingPaymentLink = await PaymentLink.findOne({
            title: title.trim(),
            createdBy: req.user.id,
            status: { $ne: 'Cancelled' }
        });

        if (existingPaymentLink) {
            return sendErrorResponse(res, 409, 'Payment link with this title already exists');
        }

        // Create new payment link
        const paymentLink = new PaymentLink({
            title: title.trim(),
            amount,
            currency: currency || 'INR',
            customerName: customerName?.trim(),
            customerEmail: customerEmail.toLowerCase(),
            description: description?.trim(),
            expiryDate: expiryDate ? new Date(expiryDate) : null,
            allowPartialPayment: allowPartialPayment || false,
            sendEmailNotification: sendEmailNotification !== false,
            sendSmsNotification: sendSmsNotification !== false,
            paymentGateway: paymentGateway || 'Razorpay',
            createdBy: req.user.id,
            metadata: metadata || {}
        });

        const savedPaymentLink = await paymentLink.save();
        
        // Populate created by user details
        await savedPaymentLink.populate('createdBy', 'name email');

        return sendSuccessResponse(res, 201, 'Payment link created successfully', savedPaymentLink);
    } catch (error) {
        console.error('Create payment link error:', error);
        
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(e => e.message);
            return sendErrorResponse(res, 400, 'Validation Error', errors);
        }
        
        return sendErrorResponse(res, 500, 'Internal server error');
    }
};

// Get all payment links with pagination and filters
const getAllPaymentLinks = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            search = '',
            sortBy = 'createdAt',
            sortOrder = 'desc',
            status = '',
            paymentStatus = '',
            currency = '',
            startDate = '',
            endDate = ''
        } = req.query;

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        // Build query object
        const query = { createdBy: req.user.id };
        
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { customerName: { $regex: search, $options: 'i' } },
                { customerEmail: { $regex: search, $options: 'i' } },
                { paymentLinkId: { $regex: search, $options: 'i' } }
            ];
        }
        
        if (status) query.status = status;
        if (paymentStatus) query.paymentStatus = paymentStatus;
        if (currency) query.currency = currency;
        
        // Date range filter
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        // Build sort object
        const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

        // Get payment links with pagination
        const paymentLinks = await PaymentLink.find(query)
            .sort(sort)
            .skip(skip)
            .limit(limitNum)
            .populate('createdBy', 'name email')
            .lean();

        // Get total count for pagination
        const totalPaymentLinks = await PaymentLink.countDocuments(query);
        const totalPages = Math.ceil(totalPaymentLinks / limitNum);

        const response = {
            paymentLinks,
            pagination: {
                currentPage: pageNum,
                totalPages,
                totalPaymentLinks,
                hasNextPage: pageNum < totalPages,
                hasPrevPage: pageNum > 1,
                limit: limitNum
            }
        };

        return sendSuccessResponse(res, 200, 'Payment links retrieved successfully', response);
    } catch (error) {
        console.error('Get all payment links error:', error);
        return sendErrorResponse(res, 500, 'Internal server error');
    }
};

// Get payment link by ID
const getPaymentLinkById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return sendErrorResponse(res, 400, 'Invalid payment link ID');
        }

        const paymentLink = await PaymentLink.findOne({
            _id: id,
            createdBy: req.user.id
        }).populate('createdBy', 'name email');

        if (!paymentLink) {
            return sendErrorResponse(res, 404, 'Payment link not found');
        }

        return sendSuccessResponse(res, 200, 'Payment link retrieved successfully', paymentLink);
    } catch (error) {
        console.error('Get payment link by ID error:', error);
        return sendErrorResponse(res, 500, 'Internal server error');
    }
};

// Get payment link by payment link ID (public endpoint)
const getPaymentLinkByLinkId = async (req, res) => {
    try {
        const { linkId } = req.params;

        const paymentLink = await PaymentLink.findOne({
            paymentLinkId: linkId.toUpperCase(),
            isActive: true
        }).populate('createdBy', 'name email');

        if (!paymentLink) {
            return sendErrorResponse(res, 404, 'Payment link not found or inactive');
        }

        // Check if payment link is expired
        if (paymentLink.expiryDate && paymentLink.expiryDate < new Date()) {
            paymentLink.status = 'Expired';
            await paymentLink.save();
            return sendErrorResponse(res, 410, 'Payment link has expired');
        }

        // Check if payment is already completed
        if (paymentLink.status === 'Paid') {
            return sendErrorResponse(res, 409, 'Payment link is already paid');
        }

        // Increment click count and update last accessed
        paymentLink.clickCount += 1;
        paymentLink.lastAccessedAt = new Date();
        await paymentLink.save();

        return sendSuccessResponse(res, 200, 'Payment link retrieved successfully', paymentLink);
    } catch (error) {
        console.error('Get payment link by link ID error:', error);
        return sendErrorResponse(res, 500, 'Internal server error');
    }
};

// Update payment link
const updatePaymentLink = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return sendErrorResponse(res, 400, 'Invalid payment link ID');
        }

        // Check if payment link exists and belongs to user
        const existingPaymentLink = await PaymentLink.findOne({
            _id: id,
            createdBy: req.user.id
        });

        if (!existingPaymentLink) {
            return sendErrorResponse(res, 404, 'Payment link not found');
        }

        // Don't allow updates if payment link is paid or has payments
        if (existingPaymentLink.status === 'Paid' || existingPaymentLink.paidAmount > 0) {
            return sendErrorResponse(res, 409, 'Cannot update payment link that has been paid or has partial payments');
        }

        // Remove fields that shouldn't be updated
        const { paymentLinkId, paidAmount, remainingAmount, paymentHistory, createdBy, ...allowedUpdates } = updateData;

        // Update payment link
        const updatedPaymentLink = await PaymentLink.findByIdAndUpdate(
            id,
            { $set: allowedUpdates },
            { 
                new: true, 
                runValidators: true 
            }
        ).populate('createdBy', 'name email');

        return sendSuccessResponse(res, 200, 'Payment link updated successfully', updatedPaymentLink);
    } catch (error) {
        console.error('Update payment link error:', error);
        
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(e => e.message);
            return sendErrorResponse(res, 400, 'Validation Error', errors);
        }
        
        return sendErrorResponse(res, 500, 'Internal server error');
    }
};

// Delete payment link
const deletePaymentLink = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return sendErrorResponse(res, 400, 'Invalid payment link ID');
        }

        const paymentLink = await PaymentLink.findOne({
            _id: id,
            createdBy: req.user.id
        });

        if (!paymentLink) {
            return sendErrorResponse(res, 404, 'Payment link not found');
        }

        // Don't allow deletion if payment link has been paid
        if (paymentLink.paidAmount > 0) {
            return sendErrorResponse(res, 409, 'Cannot delete payment link that has received payments');
        }

        await PaymentLink.findByIdAndDelete(id);

        return sendSuccessResponse(res, 200, 'Payment link deleted successfully');
    } catch (error) {
        console.error('Delete payment link error:', error);
        return sendErrorResponse(res, 500, 'Internal server error');
    }
};

// Cancel payment link
const cancelPaymentLink = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return sendErrorResponse(res, 400, 'Invalid payment link ID');
        }

        const paymentLink = await PaymentLink.findOne({
            _id: id,
            createdBy: req.user.id
        });

        if (!paymentLink) {
            return sendErrorResponse(res, 404, 'Payment link not found');
        }

        // Don't allow cancellation if payment link is already paid
        if (paymentLink.status === 'Paid') {
            return sendErrorResponse(res, 409, 'Cannot cancel a paid payment link');
        }

        paymentLink.status = 'Cancelled';
        paymentLink.isActive = false;
        await paymentLink.save();

        return sendSuccessResponse(res, 200, 'Payment link cancelled successfully', paymentLink);
    } catch (error) {
        console.error('Cancel payment link error:', error);
        return sendErrorResponse(res, 500, 'Internal server error');
    }
};

// Activate payment link
const activatePaymentLink = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return sendErrorResponse(res, 400, 'Invalid payment link ID');
        }

        const paymentLink = await PaymentLink.findOne({
            _id: id,
            createdBy: req.user.id
        });

        if (!paymentLink) {
            return sendErrorResponse(res, 404, 'Payment link not found');
        }

        // Check if payment link is expired
        if (paymentLink.expiryDate && paymentLink.expiryDate < new Date()) {
            return sendErrorResponse(res, 409, 'Cannot activate expired payment link');
        }

        paymentLink.status = 'Active';
        paymentLink.isActive = true;
        await paymentLink.save();

        return sendSuccessResponse(res, 200, 'Payment link activated successfully', paymentLink);
    } catch (error) {
        console.error('Activate payment link error:', error);
        return sendErrorResponse(res, 500, 'Internal server error');
    }
};

// Record payment for payment link
const recordPayment = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            amount,
            transactionId,
            paymentMethod,
            gatewayPaymentId,
            gatewayOrderId,
            transactionFee = 0
        } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return sendErrorResponse(res, 400, 'Invalid payment link ID');
        }

        const paymentLink = await PaymentLink.findById(id);

        if (!paymentLink) {
            return sendErrorResponse(res, 404, 'Payment link not found');
        }

        // Validate payment amount
        if (amount <= 0) {
            return sendErrorResponse(res, 400, 'Payment amount must be greater than 0');
        }

        const maxAllowedAmount = paymentLink.allowPartialPayment 
            ? paymentLink.amount 
            : paymentLink.remainingAmount;

        if (amount > maxAllowedAmount) {
            return sendErrorResponse(res, 400, 'Payment amount exceeds the allowed amount');
        }

        // Record payment
        paymentLink.paymentHistory.push({
            amount,
            transactionId,
            paymentMethod,
            status: 'Success'
        });

        paymentLink.paidAmount += amount;
        paymentLink.gatewayPaymentId = gatewayPaymentId;
        paymentLink.gatewayOrderId = gatewayOrderId;
        paymentLink.transactionFee += transactionFee;

        await paymentLink.save();

        return sendSuccessResponse(res, 200, 'Payment recorded successfully', paymentLink);
    } catch (error) {
        console.error('Record payment error:', error);
        return sendErrorResponse(res, 500, 'Internal server error');
    }
};

// Get payment link statistics
const getPaymentLinkStats = async (req, res) => {
    try {
        const userId = req.user.id;

        const stats = await PaymentLink.aggregate([
            { $match: { createdBy: new mongoose.Types.ObjectId(userId) } },
            {
                $group: {
                    _id: null,
                    totalLinks: { $sum: 1 },
                    activeLinks: {
                        $sum: { $cond: [{ $eq: ['$status', 'Active'] }, 1, 0] }
                    },
                    paidLinks: {
                        $sum: { $cond: [{ $eq: ['$status', 'Paid'] }, 1, 0] }
                    },
                    expiredLinks: {
                        $sum: { $cond: [{ $eq: ['$status', 'Expired'] }, 1, 0] }
                    },
                    totalAmount: { $sum: '$amount' },
                    totalPaidAmount: { $sum: '$paidAmount' },
                    totalClickCount: { $sum: '$clickCount' }
                }
            }
        ]);

        const result = stats[0] || {
            totalLinks: 0,
            activeLinks: 0,
            paidLinks: 0,
            expiredLinks: 0,
            totalAmount: 0,
            totalPaidAmount: 0,
            totalClickCount: 0
        };

        result.pendingAmount = result.totalAmount - result.totalPaidAmount;
        result.conversionRate = result.totalLinks > 0 
            ? ((result.paidLinks / result.totalLinks) * 100).toFixed(2)
            : 0;

        return sendSuccessResponse(res, 200, 'Payment link statistics retrieved successfully', result);
    } catch (error) {
        console.error('Get payment link stats error:', error);
        return sendErrorResponse(res, 500, 'Internal server error');
    }
};

// Search payment links
const searchPaymentLinks = async (req, res) => {
    try {
        const {
            search = '',
            page = 1,
            limit = 10,
            sortBy = 'createdAt',
            sortOrder = 'desc',
            status = '',
            paymentStatus = ''
        } = req.query;

        const options = {
            page: parseInt(page),
            limit: parseInt(limit),
            sortBy,
            sortOrder,
            status,
            paymentStatus,
            createdBy: req.user.id
        };

        const paymentLinks = await PaymentLink.searchPaymentLinks(search, options);
        const totalCount = await PaymentLink.countDocuments({
            createdBy: req.user.id,
            $or: search ? [
                { title: { $regex: search, $options: 'i' } },
                { customerName: { $regex: search, $options: 'i' } },
                { customerEmail: { $regex: search, $options: 'i' } },
                { paymentLinkId: { $regex: search, $options: 'i' } }
            ] : [{}]
        });

        const response = {
            paymentLinks,
            pagination: {
                currentPage: options.page,
                totalPages: Math.ceil(totalCount / options.limit),
                totalPaymentLinks: totalCount,
                hasNextPage: options.page < Math.ceil(totalCount / options.limit),
                hasPrevPage: options.page > 1,
                limit: options.limit
            }
        };

        return sendSuccessResponse(res, 200, 'Payment links searched successfully', response);
    } catch (error) {
        console.error('Search payment links error:', error);
        return sendErrorResponse(res, 500, 'Internal server error');
    }
};

module.exports = {
    createPaymentLink,
    getAllPaymentLinks,
    getPaymentLinkById,
    getPaymentLinkByLinkId,
    updatePaymentLink,
    deletePaymentLink,
    cancelPaymentLink,
    activatePaymentLink,
    recordPayment,
    getPaymentLinkStats,
    searchPaymentLinks
};
