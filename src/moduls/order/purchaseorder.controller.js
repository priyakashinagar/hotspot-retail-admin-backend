const PurchaseOrder = require('./purchaseorder.model');
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
const sendSuccessResponse = (res, statusCode, message, data = null, meta = null) => {
    const response = {
        success: true,
        message
    };
    
    if (data !== null) {
        response.data = data;
    }
    
    if (meta) {
        response.meta = meta;
    }
    
    return res.status(statusCode).json(response);
};

// Create a new purchase order
const createPurchaseOrder = async (req, res) => {
    try {
        const {
            vendor,
            purchaseDate,
            expectedDelivery,
            paymentTerms,
            priority,
            orderItems,
            taxRate,
            shippingCost,
            discount,
            notes,
            isRecurring,
            recurringFrequency
        } = req.body;

        // Validate required fields
        if (!vendor) {
            return sendErrorResponse(res, 400, 'Vendor is required');
        }

        if (!orderItems || !Array.isArray(orderItems) || orderItems.length === 0) {
            return sendErrorResponse(res, 400, 'At least one order item is required');
        }

        // Validate each order item
        for (let i = 0; i < orderItems.length; i++) {
            const item = orderItems[i];
            if (!item.product || !item.productName || !item.category || !item.unitPrice || !item.quantity) {
                return sendErrorResponse(res, 400, `Order item ${i + 1} is missing required fields`);
            }
            
            if (item.unitPrice <= 0 || item.quantity <= 0) {
                return sendErrorResponse(res, 400, `Order item ${i + 1} has invalid price or quantity`);
            }
        }

        // Validate vendor exists (skip validation if vendor is a static ID like '1', '2', etc.)
        // This allows both database vendors and static vendors
        if (vendor && mongoose.Types.ObjectId.isValid(vendor)) {
            const vendorExists = await mongoose.model('Supplier').findById(vendor);
            if (!vendorExists) {
                console.log('⚠️ Vendor not found in database, but allowing static vendor ID:', vendor);
                // Don't return error, allow static vendors
            }
        } else {
            console.log('⚠️ Using static vendor ID:', vendor);
        }

        // Create purchase order
        const purchaseOrder = new PurchaseOrder({
            vendor,
            purchaseDate: purchaseDate || new Date(),
            expectedDelivery,
            paymentTerms: paymentTerms || 'Net 30 Days',
            priority: priority || 'Medium',
            orderItems,
            taxRate: taxRate || 18,
            shippingCost: shippingCost || 0,
            discount: discount || 0,
            notes,
            isRecurring: isRecurring || false,
            recurringFrequency,
            createdBy: req.user?.id, // Assuming auth middleware adds user to req
            status: 'Draft'
        });

        await purchaseOrder.save();

        // Try to populate vendor and product details (will skip if vendor is not ObjectId)
        try {
            if (mongoose.Types.ObjectId.isValid(vendor)) {
                await purchaseOrder.populate([
                    { path: 'vendor', select: 'supplierName contactPerson email phone address' },
                    { path: 'orderItems.product', select: 'productName sku price' },
                    { path: 'orderItems.category', select: 'categoryName' },
                    { path: 'createdBy', select: 'name email' }
                ]);
            } else {
                // For static vendors, only populate products and categories
                await purchaseOrder.populate([
                    { path: 'orderItems.product', select: 'productName sku price' },
                    { path: 'orderItems.category', select: 'categoryName' },
                    { path: 'createdBy', select: 'name email' }
                ]);
            }
        } catch (populateError) {
            console.log('⚠️ Populate warning:', populateError.message);
            // Continue even if populate fails
        }

        return sendSuccessResponse(
            res, 
            201, 
            'Purchase order created successfully', 
            purchaseOrder
        );

    } catch (error) {
        console.error('Error creating purchase order:', error);
        
        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map(err => err.message);
            return sendErrorResponse(res, 400, 'Validation failed', validationErrors);
        }
        
        if (error.code === 11000) {
            return sendErrorResponse(res, 409, 'Purchase order with this order number already exists');
        }
        
        return sendErrorResponse(res, 500, 'Internal server error while creating purchase order');
    }
};

// Get all purchase orders with filtering, sorting, and pagination
const getAllPurchaseOrders = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            sortBy = 'createdAt',
            sortOrder = 'desc',
            status,
            vendor,
            priority,
            startDate,
            endDate,
            search,
            deliveryStatus
        } = req.query;

        // Build filter object
        const filter = { isDeleted: false };

        if (status) {
            filter.status = status;
        }

        if (vendor) {
            filter.vendor = vendor;
        }

        if (priority) {
            filter.priority = priority;
        }

        if (startDate || endDate) {
            filter.purchaseDate = {};
            if (startDate) filter.purchaseDate.$gte = new Date(startDate);
            if (endDate) filter.purchaseDate.$lte = new Date(endDate);
        }

        if (search) {
            filter.$or = [
                { orderNumber: { $regex: search, $options: 'i' } },
                { notes: { $regex: search, $options: 'i' } }
            ];
        }

        // Calculate pagination
        const pageNumber = Math.max(1, parseInt(page));
        const pageSize = Math.min(100, Math.max(1, parseInt(limit)));
        const skip = (pageNumber - 1) * pageSize;

        // Build sort object
        const sort = {};
        sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

        // Execute query
        const [purchaseOrders, totalCount] = await Promise.all([
            PurchaseOrder.find(filter)
                .populate([
                    { path: 'vendor', select: 'supplierName contactPerson email phone' },
                    { path: 'orderItems.product', select: 'productName sku' },
                    { path: 'orderItems.category', select: 'categoryName' },
                    { path: 'createdBy', select: 'name email' }
                ])
                .sort(sort)
                .skip(skip)
                .limit(pageSize)
                .lean(),
            PurchaseOrder.countDocuments(filter)
        ]);

        // Filter by delivery status if provided (virtual field)
        let filteredOrders = purchaseOrders;
        if (deliveryStatus) {
            filteredOrders = purchaseOrders.filter(order => {
                const now = new Date();
                let orderDeliveryStatus;
                
                if (order.status === 'Delivered') orderDeliveryStatus = 'Delivered';
                else if (order.status === 'Cancelled') orderDeliveryStatus = 'Cancelled';
                else if (now > new Date(order.expectedDelivery)) orderDeliveryStatus = 'Overdue';
                else {
                    const daysLeft = Math.ceil((new Date(order.expectedDelivery) - now) / (1000 * 60 * 60 * 24));
                    if (daysLeft <= 3) orderDeliveryStatus = 'Due Soon';
                    else orderDeliveryStatus = 'On Time';
                }
                
                return orderDeliveryStatus === deliveryStatus;
            });
        }

        // Calculate pagination meta
        const totalPages = Math.ceil(totalCount / pageSize);
        const hasNext = pageNumber < totalPages;
        const hasPrev = pageNumber > 1;

        const meta = {
            currentPage: pageNumber,
            totalPages,
            totalCount,
            pageSize,
            hasNext,
            hasPrev
        };

        return sendSuccessResponse(
            res,
            200,
            'Purchase orders retrieved successfully',
            filteredOrders,
            meta
        );

    } catch (error) {
        console.error('Error fetching purchase orders:', error);
        return sendErrorResponse(res, 500, 'Internal server error while fetching purchase orders');
    }
};

// Get purchase order by ID
const getPurchaseOrderById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return sendErrorResponse(res, 400, 'Invalid purchase order ID');
        }

        const purchaseOrder = await PurchaseOrder.findOne({ 
            _id: id, 
            isDeleted: false 
        }).populate([
            { 
                path: 'vendor', 
                select: 'supplierName contactPerson email phone address city state pincode'
            },
            { 
                path: 'orderItems.product', 
                select: 'productName sku price description images'
            },
            { 
                path: 'orderItems.category', 
                select: 'categoryName'
            },
            { 
                path: 'createdBy', 
                select: 'name email'
            },
            { 
                path: 'updatedBy', 
                select: 'name email'
            }
        ]);

        if (!purchaseOrder) {
            return sendErrorResponse(res, 404, 'Purchase order not found');
        }

        return sendSuccessResponse(
            res,
            200,
            'Purchase order retrieved successfully',
            purchaseOrder
        );

    } catch (error) {
        console.error('Error fetching purchase order:', error);
        return sendErrorResponse(res, 500, 'Internal server error while fetching purchase order');
    }
};

// Update purchase order
const updatePurchaseOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return sendErrorResponse(res, 400, 'Invalid purchase order ID');
        }

        // Check if purchase order exists
        const existingOrder = await PurchaseOrder.findOne({ 
            _id: id, 
            isDeleted: false 
        });

        if (!existingOrder) {
            return sendErrorResponse(res, 404, 'Purchase order not found');
        }

        // Prevent updating certain fields based on status
        if (existingOrder.status === 'Delivered') {
            return sendErrorResponse(res, 400, 'Cannot update a delivered purchase order');
        }

        if (existingOrder.status === 'Cancelled') {
            return sendErrorResponse(res, 400, 'Cannot update a cancelled purchase order');
        }

        // Validate vendor if being updated
        if (updateData.vendor) {
            const vendorExists = await mongoose.model('Supplier').findById(updateData.vendor);
            if (!vendorExists) {
                return sendErrorResponse(res, 404, 'Vendor not found');
            }
        }

        // Validate order items if being updated
        if (updateData.orderItems) {
            if (!Array.isArray(updateData.orderItems) || updateData.orderItems.length === 0) {
                return sendErrorResponse(res, 400, 'At least one order item is required');
            }

            for (let i = 0; i < updateData.orderItems.length; i++) {
                const item = updateData.orderItems[i];
                if (!item.product || !item.productName || !item.unitPrice || !item.quantity) {
                    return sendErrorResponse(res, 400, `Order item ${i + 1} is missing required fields`);
                }
                
                if (item.unitPrice <= 0 || item.quantity <= 0) {
                    return sendErrorResponse(res, 400, `Order item ${i + 1} has invalid price or quantity`);
                }
            }
        }

        // Add updatedBy field
        updateData.updatedBy = req.user?.id;

        // Update the purchase order
        const updatedOrder = await PurchaseOrder.findByIdAndUpdate(
            id,
            updateData,
            { 
                new: true, 
                runValidators: true 
            }
        ).populate([
            { path: 'vendor', select: 'supplierName contactPerson email phone address' },
            { path: 'orderItems.product', select: 'productName sku price' },
            { path: 'orderItems.category', select: 'categoryName' },
            { path: 'createdBy', select: 'name email' },
            { path: 'updatedBy', select: 'name email' }
        ]);

        return sendSuccessResponse(
            res,
            200,
            'Purchase order updated successfully',
            updatedOrder
        );

    } catch (error) {
        console.error('Error updating purchase order:', error);
        
        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map(err => err.message);
            return sendErrorResponse(res, 400, 'Validation failed', validationErrors);
        }
        
        return sendErrorResponse(res, 500, 'Internal server error while updating purchase order');
    }
};

// Delete purchase order (soft delete)
const deletePurchaseOrder = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return sendErrorResponse(res, 400, 'Invalid purchase order ID');
        }

        const purchaseOrder = await PurchaseOrder.findOne({ 
            _id: id, 
            isDeleted: false 
        });

        if (!purchaseOrder) {
            return sendErrorResponse(res, 404, 'Purchase order not found');
        }

        // Prevent deleting orders that are shipped or delivered
        if (['Shipped', 'Delivered'].includes(purchaseOrder.status)) {
            return sendErrorResponse(res, 400, `Cannot delete a ${purchaseOrder.status.toLowerCase()} purchase order`);
        }

        // Soft delete
        purchaseOrder.isDeleted = true;
        purchaseOrder.deletedAt = new Date();
        purchaseOrder.updatedBy = req.user?.id;

        await purchaseOrder.save();

        return sendSuccessResponse(
            res,
            200,
            'Purchase order deleted successfully'
        );

    } catch (error) {
        console.error('Error deleting purchase order:', error);
        return sendErrorResponse(res, 500, 'Internal server error while deleting purchase order');
    }
};

// Update order status
const updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, cancellationReason } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return sendErrorResponse(res, 400, 'Invalid purchase order ID');
        }

        if (!status) {
            return sendErrorResponse(res, 400, 'Status is required');
        }

        const validStatuses = ['Draft', 'Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled', 'Returned'];
        if (!validStatuses.includes(status)) {
            return sendErrorResponse(res, 400, 'Invalid status');
        }

        const purchaseOrder = await PurchaseOrder.findOne({ 
            _id: id, 
            isDeleted: false 
        });

        if (!purchaseOrder) {
            return sendErrorResponse(res, 404, 'Purchase order not found');
        }

        // Validate status transitions
        const currentStatus = purchaseOrder.status;
        const invalidTransitions = {
            'Delivered': ['Draft', 'Pending', 'Confirmed', 'Shipped'],
            'Cancelled': ['Draft', 'Pending', 'Confirmed', 'Shipped', 'Delivered', 'Returned'],
            'Returned': ['Draft', 'Pending', 'Confirmed', 'Shipped']
        };

        if (invalidTransitions[currentStatus] && invalidTransitions[currentStatus].includes(status)) {
            return sendErrorResponse(res, 400, `Cannot change status from ${currentStatus} to ${status}`);
        }

        // Handle cancellation
        if (status === 'Cancelled') {
            if (!cancellationReason) {
                return sendErrorResponse(res, 400, 'Cancellation reason is required when cancelling an order');
            }
            purchaseOrder.cancelledAt = new Date();
            purchaseOrder.cancellationReason = cancellationReason;
        }

        // Handle delivery
        if (status === 'Delivered') {
            purchaseOrder.deliveredAt = new Date();
        }

        purchaseOrder.status = status;
        purchaseOrder.updatedBy = req.user?.id;

        await purchaseOrder.save();

        await purchaseOrder.populate([
            { path: 'vendor', select: 'supplierName contactPerson email phone' },
            { path: 'updatedBy', select: 'name email' }
        ]);

        return sendSuccessResponse(
            res,
            200,
            `Purchase order status updated to ${status}`,
            purchaseOrder
        );

    } catch (error) {
        console.error('Error updating order status:', error);
        return sendErrorResponse(res, 500, 'Internal server error while updating order status');
    }
};

// Get purchase order statistics
const getPurchaseOrderStats = async (req, res) => {
    try {
        const stats = await PurchaseOrder.getOrderStats();
        
        const totalOrders = await PurchaseOrder.countDocuments({ isDeleted: false });
        const overdueOrders = await PurchaseOrder.countDocuments({
            isDeleted: false,
            status: { $nin: ['Delivered', 'Cancelled'] },
            expectedDelivery: { $lt: new Date() }
        });

        const recentOrders = await PurchaseOrder.find({ isDeleted: false })
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('vendor', 'supplierName')
            .select('orderNumber vendor totalAmount status createdAt');

        return sendSuccessResponse(
            res,
            200,
            'Purchase order statistics retrieved successfully',
            {
                statusStats: stats,
                totalOrders,
                overdueOrders,
                recentOrders
            }
        );

    } catch (error) {
        console.error('Error fetching purchase order stats:', error);
        return sendErrorResponse(res, 500, 'Internal server error while fetching statistics');
    }
};

// Duplicate purchase order
const duplicatePurchaseOrder = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return sendErrorResponse(res, 400, 'Invalid purchase order ID');
        }

        const originalOrder = await PurchaseOrder.findOne({ 
            _id: id, 
            isDeleted: false 
        });

        if (!originalOrder) {
            return sendErrorResponse(res, 404, 'Purchase order not found');
        }

        // Create new order with same data but reset certain fields
        const duplicateData = originalOrder.toObject();
        delete duplicateData._id;
        delete duplicateData.orderNumber; // Will be auto-generated
        delete duplicateData.createdAt;
        delete duplicateData.updatedAt;
        delete duplicateData.deliveredAt;
        delete duplicateData.cancelledAt;
        delete duplicateData.cancellationReason;

        duplicateData.status = 'Draft';
        duplicateData.purchaseDate = new Date();
        duplicateData.createdBy = req.user?.id;
        duplicateData.updatedBy = undefined;

        const duplicateOrder = new PurchaseOrder(duplicateData);
        await duplicateOrder.save();

        await duplicateOrder.populate([
            { path: 'vendor', select: 'supplierName contactPerson email phone address' },
            { path: 'orderItems.product', select: 'productName sku price' },
            { path: 'orderItems.category', select: 'categoryName' },
            { path: 'createdBy', select: 'name email' }
        ]);

        return sendSuccessResponse(
            res,
            201,
            'Purchase order duplicated successfully',
            duplicateOrder
        );

    } catch (error) {
        console.error('Error duplicating purchase order:', error);
        return sendErrorResponse(res, 500, 'Internal server error while duplicating purchase order');
    }
};

// Bulk delete purchase orders (soft delete)
const bulkDeletePurchaseOrders = async (req, res) => {
    try {
        const { orderIds } = req.body;

        if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
            return sendErrorResponse(res, 400, 'Order IDs array is required');
        }

        // Validate all IDs
        const invalidIds = orderIds.filter(id => !mongoose.Types.ObjectId.isValid(id));
        if (invalidIds.length > 0) {
            return sendErrorResponse(res, 400, 'Invalid order IDs found');
        }

        // Find orders that cannot be deleted
        const orders = await PurchaseOrder.find({ 
            _id: { $in: orderIds }, 
            isDeleted: false 
        });

        const cannotDelete = orders.filter(order => 
            ['Shipped', 'Delivered'].includes(order.status)
        );

        if (cannotDelete.length > 0) {
            return sendErrorResponse(
                res, 
                400, 
                `Cannot delete ${cannotDelete.length} order(s) that are shipped or delivered`
            );
        }

        // Soft delete all valid orders
        const result = await PurchaseOrder.updateMany(
            { 
                _id: { $in: orderIds }, 
                isDeleted: false,
                status: { $nin: ['Shipped', 'Delivered'] }
            },
            { 
                $set: { 
                    isDeleted: true, 
                    deletedAt: new Date(),
                    updatedBy: req.user?.id
                } 
            }
        );

        return sendSuccessResponse(
            res,
            200,
            `${result.modifiedCount} purchase order(s) deleted successfully`
        );

    } catch (error) {
        console.error('Error bulk deleting purchase orders:', error);
        return sendErrorResponse(res, 500, 'Internal server error while bulk deleting purchase orders');
    }
};

// Export purchase orders to CSV
const exportPurchaseOrders = async (req, res) => {
    try {
        const {
            status,
            vendor,
            priority,
            startDate,
            endDate,
            search
        } = req.query;

        // Build filter object
        const filter = { isDeleted: false };

        if (status) filter.status = status;
        if (vendor) filter.vendor = vendor;
        if (priority) filter.priority = priority;
        if (startDate || endDate) {
            filter.purchaseDate = {};
            if (startDate) filter.purchaseDate.$gte = new Date(startDate);
            if (endDate) filter.purchaseDate.$lte = new Date(endDate);
        }
        if (search) {
            filter.$or = [
                { orderNumber: { $regex: search, $options: 'i' } },
                { notes: { $regex: search, $options: 'i' } }
            ];
        }

        // Get all orders matching the filter
        const orders = await PurchaseOrder.find(filter)
            .populate('vendor', 'supplierName contactPerson email phone')
            .populate('orderItems.product', 'productName sku')
            .populate('orderItems.category', 'categoryName')
            .sort({ createdAt: -1 })
            .lean();

        // Create CSV content
        let csvContent = 'Order Number,Vendor,Status,Priority,Payment Terms,Purchase Date,Expected Delivery,Subtotal,Tax Rate,Tax Amount,Shipping Cost,Discount,Total Amount,Items Count,Notes,Created At\n';

        orders.forEach(order => {
            const vendorName = order.vendor?.supplierName || 'N/A';
            const purchaseDate = new Date(order.purchaseDate).toLocaleDateString('en-IN');
            const expectedDelivery = new Date(order.expectedDelivery).toLocaleDateString('en-IN');
            const createdAt = new Date(order.createdAt).toLocaleDateString('en-IN');
            const notes = (order.notes || '').replace(/,/g, ';').replace(/\n/g, ' ');

            csvContent += `"${order.orderNumber}","${vendorName}","${order.status}","${order.priority}","${order.paymentTerms}","${purchaseDate}","${expectedDelivery}",${order.subtotal},${order.taxRate},${order.taxAmount},${order.shippingCost},${order.discount},${order.totalAmount},${order.orderItems.length},"${notes}","${createdAt}"\n`;
        });

        // Set headers for file download
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="purchase-orders-${Date.now()}.csv"`);
        
        return res.status(200).send(csvContent);

    } catch (error) {
        console.error('Error exporting purchase orders:', error);
        return sendErrorResponse(res, 500, 'Internal server error while exporting purchase orders');
    }
};

module.exports = {
    createPurchaseOrder,
    getAllPurchaseOrders,
    getPurchaseOrderById,
    updatePurchaseOrder,
    deletePurchaseOrder,
    bulkDeletePurchaseOrders,
    updateOrderStatus,
    getPurchaseOrderStats,
    duplicatePurchaseOrder,
    exportPurchaseOrders
};
