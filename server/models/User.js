import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['seeker', 'recruiter'],
    default: 'seeker'
  },
  profile: {
    headline: String,
    location: String,
    resumeUrl: String, 
    companyName: String 
  }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
export default User;