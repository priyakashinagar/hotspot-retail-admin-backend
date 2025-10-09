const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
  supplierName: {
    type: String,
    required: [true, 'Supplier name is required'],
    trim: true,
    minlength: 2,
    maxlength: 100
  },
  contactPerson: {
    type: String,
    required: [true, 'Contact person name is required'],
    trim: true,
    minlength: 2,
    maxlength: 100
  },
  email: {
    type: String,
    required: [true, 'Email address is required'],
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    match: [/^\+?\d{10,15}$/, 'Please enter a valid phone number']
  },
  address: {
    type: String,
    trim: true,
    maxlength: 300
  },
  city: {
    type: String,
    trim: true,
    maxlength: 50
  },
  state: {
    type: String,
    trim: true,
    maxlength: 50
  },
  pincode: {
    type: String,
    trim: true,
    match: [/^\d{5,8}$/, 'Please enter a valid pincode']
  },
  gstNumber: {
    type: String,
    trim: true,
    maxlength: 20
  },
  panNumber: {
    type: String,
    trim: true,
    maxlength: 20
  },
  category: {
    type: String,
    trim: true,
    maxlength: 50
  },
  paymentTerms: {
    type: String,
    trim: true,
    maxlength: 30,
    default: '30 Days'
  },
  website: {
    type: String,
    trim: true,
    match: [/^(https?:\/\/)?([\w\-])+\.[\w\-]+(\.[\w\-]+)*(\/[\w\-.,@?^=%&:/~+#]*)?$/, 'Please enter a valid website URL']
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 500
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

supplierSchema.index({ supplierName: 1 });
supplierSchema.index({ email: 1 });
supplierSchema.index({ phone: 1 });

const Supplier = mongoose.model('Supplier', supplierSchema);

module.exports = Supplier;
