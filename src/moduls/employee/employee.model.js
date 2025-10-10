const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: [true, 'Full name is required'],
        trim: true,
        maxlength: [100, 'Full name cannot exceed 100 characters']
    },
    employeeId: {
        type: String,
        required: [true, 'Employee ID is required'],
        unique: true,
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    mobileNumber: {
        type: String,
        required: [true, 'Mobile number is required'],
        match: [/^\+?[1-9]\d{1,14}$/, 'Please enter a valid mobile number']
    },
    position: {
        type: String,
        required: [true, 'Position is required'],
        trim: true
    },
    department: {
        type: String,
        required: [true, 'Department is required'],
        trim: true
    },
    salary: {
        type: Number,
        required: [true, 'Salary is required'],
        min: [0, 'Salary cannot be negative']
    },
    joiningDate: {
        type: Date,
        required: [true, 'Joining date is required']
    },
    dateOfBirth: {
        type: Date,
        required: [true, 'Date of birth is required']
    },
    gender: {
        type: String,
        required: [true, 'Gender is required'],
        enum: ['Male', 'Female', 'Other']
    },
    experienceYears: {
        type: Number,
        default: 0,
        min: [0, 'Experience cannot be negative']
    },
    qualification: {
        type: String,
        trim: true
    },
    skills: {
        type: [String],
        default: []
    },
    address: {
        street: {
            type: String,
            trim: true
        },
        city: {
            type: String,
            trim: true
        },
        state: {
            type: String,
            trim: true
        },
        pincode: {
            type: String,
            trim: true,
            match: [/^\d{6}$/, 'Please enter a valid pincode']
        }
    },
    emergencyContact: {
        name: {
            type: String,
            trim: true
        },
        phone: {
            type: String,
            match: [/^\+?[1-9]\d{1,14}$/, 'Please enter a valid phone number']
        }
    },
    notes: {
        type: String,
        trim: true,
        maxlength: [500, 'Notes cannot exceed 500 characters']
    },
    isActive: {
        type: Boolean,
        default: true
    },
    profileImage: {
        type: String,
        default: null
    }
}, {
    timestamps: true
});

// Index for better performance
employeeSchema.index({ employeeId: 1 });
employeeSchema.index({ email: 1 });
employeeSchema.index({ department: 1 });
employeeSchema.index({ isActive: 1 });

// Virtual for age calculation
employeeSchema.virtual('age').get(function() {
    if (this.dateOfBirth) {
        const today = new Date();
        const birthDate = new Date(this.dateOfBirth);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    }
    return null;
});

// Virtual for full address
employeeSchema.virtual('fullAddress').get(function() {
    if (this.address && this.address.street) {
        return `${this.address.street}, ${this.address.city}, ${this.address.state} - ${this.address.pincode}`;
    }
    return '';
});

// Ensure virtual fields are serialized
employeeSchema.set('toJSON', { virtuals: true });
employeeSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Employee', employeeSchema);
