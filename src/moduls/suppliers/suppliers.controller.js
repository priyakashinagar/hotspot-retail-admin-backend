const Supplier = require('./suppliers.model');
const mongoose = require('mongoose');

// Create supplier
const createSupplier = async (req, res) => {
  try {
    const supplier = new Supplier(req.body);
    await supplier.save();
    res.status(201).json({ success: true, message: 'Supplier created', data: supplier });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// Get all suppliers (with search, filter, pagination)
const getSuppliers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      category,
      state,
      isActive
    } = req.query;
    const query = {};
    if (search) {
      query.$or = [
        { supplierName: { $regex: search, $options: 'i' } },
        { contactPerson: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } },
        { state: { $regex: search, $options: 'i' } },
        { gstNumber: { $regex: search, $options: 'i' } },
        { panNumber: { $regex: search, $options: 'i' } }
      ];
    }
    if (category) query.category = category;
    if (state) query.state = state;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const suppliers = await Supplier.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    const total = await Supplier.countDocuments(query);
    res.status(200).json({
      success: true,
      data: suppliers,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit),
        hasNextPage: skip + parseInt(limit) < total,
        hasPreviousPage: parseInt(page) > 1
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get supplier by ID
const getSupplierById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid supplier ID' });
    }
    const supplier = await Supplier.findById(id);
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }
    res.status(200).json({ success: true, data: supplier });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Update supplier
const updateSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid supplier ID' });
    }
    const supplier = await Supplier.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }
    res.status(200).json({ success: true, message: 'Supplier updated', data: supplier });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// Delete supplier
const deleteSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid supplier ID' });
    }
    const supplier = await Supplier.findByIdAndDelete(id);
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }
    res.status(200).json({ success: true, message: 'Supplier deleted', data: supplier });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Toggle supplier active status
const toggleSupplierStatus = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid supplier ID' });
    }
    const supplier = await Supplier.findById(id);
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }
    supplier.isActive = !supplier.isActive;
    await supplier.save();
    res.status(200).json({ success: true, message: `Supplier status updated to ${supplier.isActive ? 'active' : 'inactive'}`, data: supplier });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  createSupplier,
  getSuppliers,
  getSupplierById,
  updateSupplier,
  deleteSupplier,
  toggleSupplierStatus
};
