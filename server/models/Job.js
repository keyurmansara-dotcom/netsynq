import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema({
  recruiter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company'
  },
  title: { type: String, required: true },
  company: { type: String, required: true },
  location: { type: String, required: true },
  description: { type: String, required: true },
  skillsRequired: [{ type: String }],
  type: {
    type: String,
    enum: ['Full-time', 'Part-time', 'Contract', 'Remote'],
    default: 'Full-time'
  },
  applicants: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      status: { 
        type: String, 
        enum: ['Pending', 'Reviewed', 'Hired', 'Rejected'],
        default: 'Pending'
      },
      notes: { type: String, default: '' },
      appliedAt: { type: Date, default: Date.now }
    }
  ]
}, { timestamps: true });

const Job = mongoose.model('Job', jobSchema);
export default Job;