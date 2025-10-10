const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
    locationName: {
        type: String,
        required: [true, 'Location name is required'],
        trim: true,
        maxlength: [100, 'Location name cannot exceed 100 characters']
    },
    fullAddress: {
        type: String,
        required: [true, 'Full address is required'],
        trim: true,
        maxlength: [500, 'Full address cannot exceed 500 characters']
    },
    city: {
        type: String,
        required: [true, 'City is required'],
        trim: true,
        maxlength: [50, 'City name cannot exceed 50 characters']
    },
    state: {
        type: String,
        required: [true, 'State is required'],
        trim: true,
        maxlength: [50, 'State name cannot exceed 50 characters']
    },
    pincode: {
        type: String,
        required: [true, 'Pincode is required'],
        match: [/^\d{6}$/, 'Please enter a valid 6-digit pincode']
    },
    phoneNumber: {
        type: String,
        match: [/^\+?[1-9]\d{1,14}$/, 'Please enter a valid phone number']
    },
    emailAddress: {
        type: String,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    managerName: {
        type: String,
        trim: true,
        maxlength: [100, 'Manager name cannot exceed 100 characters']
    },
    openingTime: {
        type: String,
        required: [true, 'Opening time is required'],
        match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9] (AM|PM)$/, 'Please enter time in HH:MM AM/PM format']
    },
    closingTime: {
        type: String,
        required: [true, 'Closing time is required'],
        match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9] (AM|PM)$/, 'Please enter time in HH:MM AM/PM format']
    },
    deliveryAvailable: {
        type: Boolean,
        default: true
    },
    pickupAvailable: {
        type: Boolean,
        default: true
    },
    locationActive: {
        type: Boolean,
        default: true
    },
    coordinates: {
        latitude: {
            type: Number,
            min: [-90, 'Latitude must be between -90 and 90'],
            max: [90, 'Latitude must be between -90 and 90']
        },
        longitude: {
            type: Number,
            min: [-180, 'Longitude must be between -180 and 180'],
            max: [180, 'Longitude must be between -180 and 180']
        }
    },
    deliveryRadius: {
        type: Number,
        default: 10,
        min: [0, 'Delivery radius cannot be negative'],
        max: [100, 'Delivery radius cannot exceed 100 km']
    },
    minimumOrderAmount: {
        type: Number,
        default: 0,
        min: [0, 'Minimum order amount cannot be negative']
    },
    deliveryCharge: {
        type: Number,
        default: 0,
        min: [0, 'Delivery charge cannot be negative']
    },
    description: {
        type: String,
        trim: true,
        maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    facilities: {
        type: [String],
        default: []
    },
    images: {
        type: [String],
        default: []
    }
}, {
    timestamps: true
});

// Index for better performance
locationSchema.index({ locationName: 1 });
locationSchema.index({ city: 1 });
locationSchema.index({ state: 1 });
locationSchema.index({ pincode: 1 });
locationSchema.index({ locationActive: 1 });
locationSchema.index({ 'coordinates.latitude': 1, 'coordinates.longitude': 1 });

// Virtual for full location info
locationSchema.virtual('fullLocationInfo').get(function() {
    return `${this.locationName}, ${this.city}, ${this.state} - ${this.pincode}`;
});

// Virtual for operating hours
locationSchema.virtual('operatingHours').get(function() {
    return `${this.openingTime} - ${this.closingTime}`;
});

// Virtual for services available
locationSchema.virtual('servicesAvailable').get(function() {
    const services = [];
    if (this.deliveryAvailable) services.push('Delivery');
    if (this.pickupAvailable) services.push('Pickup');
    return services;
});

// Method to check if location is currently open
locationSchema.methods.isCurrentlyOpen = function() {
    const now = new Date();
    const currentTime = now.toLocaleTimeString('en-US', { 
        hour12: true, 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    
    // Convert times to 24-hour format for comparison
    const convertTo24Hour = (time12h) => {
        const [time, modifier] = time12h.split(' ');
        let [hours, minutes] = time.split(':');
        if (hours === '12') {
            hours = '00';
        }
        if (modifier === 'PM') {
            hours = parseInt(hours, 10) + 12;
        }
        return `${hours}:${minutes}`;
    };
    
    const currentTime24 = convertTo24Hour(currentTime);
    const openingTime24 = convertTo24Hour(this.openingTime);
    const closingTime24 = convertTo24Hour(this.closingTime);
    
    return currentTime24 >= openingTime24 && currentTime24 <= closingTime24;
};

// Method to calculate distance from given coordinates
locationSchema.methods.calculateDistance = function(lat, lng) {
    if (!this.coordinates.latitude || !this.coordinates.longitude) {
        return null;
    }
    
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat - this.coordinates.latitude) * Math.PI / 180;
    const dLng = (lng - this.coordinates.longitude) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(this.coordinates.latitude * Math.PI / 180) * Math.cos(lat * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
};

// Ensure virtual fields are serialized
locationSchema.set('toJSON', { virtuals: true });
locationSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Location', locationSchema);
