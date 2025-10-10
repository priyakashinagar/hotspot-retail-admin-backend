const Location = require('./location.model');
const mongoose = require('mongoose');

// Get all locations
exports.getAllLocations = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            search = '',
            city = '',
            state = '',
            locationActive = '',
            deliveryAvailable = '',
            pickupAvailable = '',
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
                { locationName: { $regex: search, $options: 'i' } },
                { fullAddress: { $regex: search, $options: 'i' } },
                { managerName: { $regex: search, $options: 'i' } },
                { pincode: { $regex: search, $options: 'i' } }
            ];
        }

        if (city) {
            filter.city = { $regex: city, $options: 'i' };
        }

        if (state) {
            filter.state = { $regex: state, $options: 'i' };
        }

        if (locationActive !== '') {
            filter.locationActive = locationActive === 'true';
        }

        if (deliveryAvailable !== '') {
            filter.deliveryAvailable = deliveryAvailable === 'true';
        }

        if (pickupAvailable !== '') {
            filter.pickupAvailable = pickupAvailable === 'true';
        }

        // Build sort object
        const sort = {};
        sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

        const locations = await Location.find(filter)
            .sort(sort)
            .skip(skip)
            .limit(limitNumber)
            .select('-__v');

        const total = await Location.countDocuments(filter);
        const totalPages = Math.ceil(total / limitNumber);

        res.status(200).json({
            success: true,
            message: 'Locations retrieved successfully',
            data: {
                locations,
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
        console.error('Get all locations error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Get location by ID
exports.getLocationById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid location ID format'
            });
        }

        const location = await Location.findById(id).select('-__v');

        if (!location) {
            return res.status(404).json({
                success: false,
                message: 'Location not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Location retrieved successfully',
            data: location
        });
    } catch (error) {
        console.error('Get location by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Create new location
exports.createLocation = async (req, res) => {
    try {
        const locationData = req.body;

        // Check if location name already exists in the same city
        const existingLocation = await Location.findOne({ 
            locationName: locationData.locationName,
            city: locationData.city 
        });
        
        if (existingLocation) {
            return res.status(400).json({
                success: false,
                message: 'Location with this name already exists in this city'
            });
        }

        const location = new Location(locationData);
        await location.save();

        res.status(201).json({
            success: true,
            message: 'Location created successfully',
            data: location
        });
    } catch (error) {
        console.error('Create location error:', error);
        
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

// Update location
exports.updateLocation = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid location ID format'
            });
        }

        // Check if location exists
        const existingLocation = await Location.findById(id);
        if (!existingLocation) {
            return res.status(404).json({
                success: false,
                message: 'Location not found'
            });
        }

        // Check if location name is being updated and already exists in the same city
        if (updateData.locationName && updateData.city) {
            const duplicateLocation = await Location.findOne({ 
                locationName: updateData.locationName,
                city: updateData.city,
                _id: { $ne: id }
            });
            
            if (duplicateLocation) {
                return res.status(400).json({
                    success: false,
                    message: 'Location with this name already exists in this city'
                });
            }
        }

        const location = await Location.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        ).select('-__v');

        res.status(200).json({
            success: true,
            message: 'Location updated successfully',
            data: location
        });
    } catch (error) {
        console.error('Update location error:', error);
        
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

// Delete location (soft delete)
exports.deleteLocation = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid location ID format'
            });
        }

        const location = await Location.findById(id);
        if (!location) {
            return res.status(404).json({
                success: false,
                message: 'Location not found'
            });
        }

        // Soft delete by setting locationActive to false
        location.locationActive = false;
        await location.save();

        res.status(200).json({
            success: true,
            message: 'Location deactivated successfully'
        });
    } catch (error) {
        console.error('Delete location error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Permanently delete location
exports.permanentDeleteLocation = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid location ID format'
            });
        }

        const location = await Location.findByIdAndDelete(id);
        if (!location) {
            return res.status(404).json({
                success: false,
                message: 'Location not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Location permanently deleted successfully'
        });
    } catch (error) {
        console.error('Permanent delete location error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Restore location (activate)
exports.restoreLocation = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid location ID format'
            });
        }

        const location = await Location.findById(id);
        if (!location) {
            return res.status(404).json({
                success: false,
                message: 'Location not found'
            });
        }

        location.locationActive = true;
        await location.save();

        res.status(200).json({
            success: true,
            message: 'Location activated successfully',
            data: location
        });
    } catch (error) {
        console.error('Restore location error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Get location statistics
exports.getLocationStats = async (req, res) => {
    try {
        const totalLocations = await Location.countDocuments();
        const activeLocations = await Location.countDocuments({ locationActive: true });
        const inactiveLocations = await Location.countDocuments({ locationActive: false });
        const deliveryEnabledLocations = await Location.countDocuments({ deliveryAvailable: true, locationActive: true });
        const pickupEnabledLocations = await Location.countDocuments({ pickupAvailable: true, locationActive: true });

        // State-wise count
        const stateStats = await Location.aggregate([
            { $match: { locationActive: true } },
            { $group: { _id: '$state', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        // City-wise count
        const cityStats = await Location.aggregate([
            { $match: { locationActive: true } },
            { $group: { _id: '$city', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        res.status(200).json({
            success: true,
            message: 'Location statistics retrieved successfully',
            data: {
                overview: {
                    total: totalLocations,
                    active: activeLocations,
                    inactive: inactiveLocations,
                    deliveryEnabled: deliveryEnabledLocations,
                    pickupEnabled: pickupEnabledLocations
                },
                stateWise: stateStats,
                cityWise: cityStats
            }
        });
    } catch (error) {
        console.error('Get location stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Find nearby locations
exports.findNearbyLocations = async (req, res) => {
    try {
        const { latitude, longitude, radius = 10 } = req.query;

        if (!latitude || !longitude) {
            return res.status(400).json({
                success: false,
                message: 'Latitude and longitude are required'
            });
        }

        const lat = parseFloat(latitude);
        const lng = parseFloat(longitude);
        const radiusKm = parseFloat(radius);

        if (isNaN(lat) || isNaN(lng) || isNaN(radiusKm)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid coordinates or radius'
            });
        }

        const locations = await Location.find({
            locationActive: true,
            'coordinates.latitude': { $exists: true },
            'coordinates.longitude': { $exists: true }
        });

        // Filter locations within radius and calculate distance
        const nearbyLocations = locations
            .map(location => {
                const distance = location.calculateDistance(lat, lng);
                return { ...location.toObject(), distance };
            })
            .filter(location => location.distance !== null && location.distance <= radiusKm)
            .sort((a, b) => a.distance - b.distance);

        res.status(200).json({
            success: true,
            message: 'Nearby locations retrieved successfully',
            data: {
                searchCoordinates: { latitude: lat, longitude: lng },
                radius: radiusKm,
                count: nearbyLocations.length,
                locations: nearbyLocations
            }
        });
    } catch (error) {
        console.error('Find nearby locations error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Get locations by city
exports.getLocationsByCity = async (req, res) => {
    try {
        const { city } = req.params;
        const { locationActive = 'true' } = req.query;

        const filter = { 
            city: { $regex: city, $options: 'i' }
        };

        if (locationActive !== '') {
            filter.locationActive = locationActive === 'true';
        }

        const locations = await Location.find(filter)
            .sort({ locationName: 1 })
            .select('-__v');

        res.status(200).json({
            success: true,
            message: `Locations in ${city} retrieved successfully`,
            data: {
                city,
                count: locations.length,
                locations
            }
        });
    } catch (error) {
        console.error('Get locations by city error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Check if location is currently open
exports.checkLocationStatus = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid location ID format'
            });
        }

        const location = await Location.findById(id);
        if (!location) {
            return res.status(404).json({
                success: false,
                message: 'Location not found'
            });
        }

        const isOpen = location.isCurrentlyOpen();
        const currentTime = new Date().toLocaleTimeString('en-US', { 
            hour12: true, 
            hour: '2-digit', 
            minute: '2-digit' 
        });

        res.status(200).json({
            success: true,
            message: 'Location status retrieved successfully',
            data: {
                locationName: location.locationName,
                isOpen,
                currentTime,
                operatingHours: location.operatingHours,
                openingTime: location.openingTime,
                closingTime: location.closingTime,
                locationActive: location.locationActive
            }
        });
    } catch (error) {
        console.error('Check location status error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};
