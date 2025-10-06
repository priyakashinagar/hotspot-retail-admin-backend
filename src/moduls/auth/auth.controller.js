const User = require('./auth.model');
const jwt = require('jsonwebtoken');

// Response helper function
const sendResponse = (res, statusCode, success, message, data = null) => {
    return res.status(statusCode).json({
        success,
        message,
        data
    });
};

// Login controller
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return sendResponse(res, 400, false, 'Email and password are required');
        }

        // Find user by email
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return sendResponse(res, 401, false, 'Invalid email or password');
        }

        // Check if user is active
        if (!user.isActive) {
            return sendResponse(res, 401, false, 'Account is deactivated. Please contact administrator');
        }

        // Compare password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return sendResponse(res, 401, false, 'Invalid email or password');
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        // Generate token
        const token = user.generateAuthToken();

        // Send response
        return sendResponse(res, 200, true, 'Login successful', {
            token,
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                role: user.role,
                lastLogin: user.lastLogin
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        return sendResponse(res, 500, false, 'Internal server error');
    }
};

// Register controller (for creating admin users)
const register = async (req, res) => {
    try {
        const { email, password, name, role = 'user' } = req.body;

        // Validate input
        if (!email || !password || !name) {
            return sendResponse(res, 400, false, 'Email, password, and name are required');
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return sendResponse(res, 409, false, 'User with this email already exists');
        }

        // Create new user
        const user = new User({
            email: email.toLowerCase(),
            password,
            name,
            role
        });

        await user.save();

        // Generate token
        const token = user.generateAuthToken();

        return sendResponse(res, 201, true, 'User registered successfully', {
            token,
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        
        // Handle validation errors
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            return sendResponse(res, 400, false, errors.join(', '));
        }

        return sendResponse(res, 500, false, 'Internal server error');
    }
};

// Get current user profile
const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return sendResponse(res, 404, false, 'User not found');
        }

        return sendResponse(res, 200, true, 'Profile retrieved successfully', {
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                role: user.role,
                lastLogin: user.lastLogin,
                createdAt: user.createdAt
            }
        });

    } catch (error) {
        console.error('Get profile error:', error);
        return sendResponse(res, 500, false, 'Internal server error');
    }
};

// Logout controller (optional - mainly for token blacklisting if implemented)
const logout = async (req, res) => {
    try {
        // In a simple JWT implementation, logout is handled on the client side
        // by removing the token. For enhanced security, you might want to 
        // implement token blacklisting here.
        
        return sendResponse(res, 200, true, 'Logged out successfully');
        
    } catch (error) {
        console.error('Logout error:', error);
        return sendResponse(res, 500, false, 'Internal server error');
    }
};

// Change password
const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return sendResponse(res, 400, false, 'Current password and new password are required');
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return sendResponse(res, 404, false, 'User not found');
        }

        // Verify current password
        const isCurrentPasswordValid = await user.comparePassword(currentPassword);
        if (!isCurrentPasswordValid) {
            return sendResponse(res, 401, false, 'Current password is incorrect');
        }

        // Update password
        user.password = newPassword;
        await user.save();

        return sendResponse(res, 200, true, 'Password changed successfully');

    } catch (error) {
        console.error('Change password error:', error);
        return sendResponse(res, 500, false, 'Internal server error');
    }
};

module.exports = {
    login,
    register,
    getProfile,
    logout,
    changePassword
};
