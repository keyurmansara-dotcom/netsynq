import mongoose from 'mongoose';

const companySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  logoUrl: {
    type: String,
    default: ''
  },
  website: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    default: ''
  },
  industry: {
    type: String,
    default: ''
  },
  location: {
    type: String,
    default: ''
  },
  employeeCount: {
    type: String,
    default: ''
  },
  recruiters: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, { timestamps: true });

const Company = mongoose.model('Company', companySchema);
export default Company;