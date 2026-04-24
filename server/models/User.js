import mongoose from 'mongoose';

const experienceSchema = new mongoose.Schema({
  title: { type: String, default: '' },
  company: { type: String, default: '' },
  location: { type: String, default: '' },
  startDate: { type: String, default: '' },
  endDate: { type: String, default: '' },
  currentlyWorking: { type: Boolean, default: false },
  description: { type: String, default: '' }
}, { _id: true });

const educationSchema = new mongoose.Schema({
  school: { type: String, default: '' },
  degree: { type: String, default: '' },
  fieldOfStudy: { type: String, default: '' },
  startDate: { type: String, default: '' },
  endDate: { type: String, default: '' },
  description: { type: String, default: '' }
}, { _id: true });

const projectSchema = new mongoose.Schema({
  name: { type: String, default: '' },
  description: { type: String, default: '' },
  url: { type: String, default: '' },
  technologies: [{ type: String, default: '' }],
  startDate: { type: String, default: '' },
  endDate: { type: String, default: '' }
}, { _id: true });

const linkSchema = new mongoose.Schema({
  github: { type: String, default: '' },
  portfolio: { type: String, default: '' },
  linkedin: { type: String, default: '' },
  website: { type: String, default: '' }
}, { _id: false });

const privacySchema = new mongoose.Schema({
  profileVisibility: {
    type: String,
    enum: ['public', 'connections', 'private'],
    default: 'public'
  },
  searchable: {
    type: Boolean,
    default: true
  },
  showResume: {
    type: Boolean,
    default: true
  },
  allowConnectionRequests: {
    type: Boolean,
    default: true
  }
}, { _id: false });

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
  refreshTokens: [{
    tokenHash: {
      type: String,
      required: true
    },
    expiresAt: {
      type: Date,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  resetPasswordToken: {
    type: String,
    default: null
  },
  resetPasswordExpires: {
    type: Date,
    default: null
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
    companyName: String,
    summary: String,
    avatarUrl: String,
    website: String,
    industry: String
  },
  experience: [experienceSchema],
  education: [educationSchema],
  skills: [{ type: String, default: '' }],
  projects: [projectSchema],
  links: {
    type: linkSchema,
    default: () => ({})
  },
  privacy: {
    type: privacySchema,
    default: () => ({})
  },
  openToWork: {
    type: Boolean,
    default: false
  },
  connections: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  following: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  connectionRequests: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  sentRequests: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
export default User;