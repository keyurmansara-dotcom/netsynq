import Company from '../models/Company.js';
import Job from '../models/Job.js';
import Notification from '../models/Notification.js';
import { createAndEmitNotification } from '../services/realtimeService.js';

const buildJobQuery = (req) => {
  const query = {};
  const search = String(req.query.q || '').trim();
  if (search) {
    const searchRegex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    query.$or = [
      { title: searchRegex },
      { company: searchRegex },
      { location: searchRegex },
      { description: searchRegex },
      { skillsRequired: searchRegex }
    ];
  }
  return query;
};

// Get AI Recommended Jobs or all jobs (New Feature Logic Placeholder)
export const getJobs = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 50);
    const skip = (page - 1) * limit;
    const filter = buildJobQuery(req);
    const jobs = await Job.find(filter)
      .populate('recruiter', 'name profile.companyName')
      .populate('companyId', 'name logoUrl website description industry location employeeCount')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: 'Server Error fetching jobs' });
  }
};

// Get Recruiter's Posted Jobs with Applicants
export const getRecruiterJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ recruiter: req.user.userId })
      .populate('applicants.user', 'name email profile.headline profile.resumeUrl') // Populate applicant details
      .populate('companyId', 'name logoUrl website description industry location employeeCount')
      .sort({ createdAt: -1 });
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: 'Server Error fetching recruiter jobs' });
  }
};

export const getMyApplications = async (req, res) => {
  try {
    const jobs = await Job.find({ 'applicants.user': req.user.userId })
      .populate('recruiter', 'name profile.companyName')
      .populate('companyId', 'name logoUrl website description industry location employeeCount')
      .sort({ updatedAt: -1 });

    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: 'Server Error fetching applications' });
  }
};

// Create a Job (Recruiter Only)
export const createJob = async (req, res) => {
  const { title, company, location, description, skillsRequired, type } = req.body;
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ message: 'Not authorized to create jobs' });
    }

    const normalizedSkills = Array.isArray(skillsRequired)
      ? skillsRequired.map((skill) => String(skill).trim()).filter(Boolean)
      : String(skillsRequired || '')
          .split(',')
          .map((skill) => skill.trim())
          .filter(Boolean);

    const missingFields = [];
    if (!String(title || '').trim()) missingFields.push('title');
    if (!String(company || '').trim()) missingFields.push('company');
    if (!String(location || '').trim()) missingFields.push('location');
    if (!String(description || '').trim()) missingFields.push('description');

    if (missingFields.length > 0) {
      return res.status(400).json({
        message: `Missing required job field(s): ${missingFields.join(', ')}`
      });
    }

    const companyName = String(company).trim();
    let companyRecord = await Company.findOne({ name: companyName });
    if (!companyRecord) {
      companyRecord = await Company.create({
        name: companyName,
        description: `${companyName} hiring via Netsynq`,
        recruiters: [req.user.userId]
      });
    } else if (!companyRecord.recruiters.some((recruiterId) => recruiterId.toString() === req.user.userId)) {
      companyRecord.recruiters.push(req.user.userId);
      await companyRecord.save();
    }

    const job = new Job({
      recruiter: req.user.userId,
      title: String(title).trim(),
      company: companyName,
      companyId: companyRecord._id,
      location: String(location).trim(),
      description: String(description).trim(),
      skillsRequired: normalizedSkills,
      type: type || 'Full-time'
    });
    const createdJob = await job.save();
    res.status(201).json(createdJob);
  } catch (error) {
    console.error('Create job error:', error);

    if (error?.name === 'ValidationError') {
      return res.status(400).json({
        message: Object.values(error.errors).map((item) => item.message).join(', ')
      });
    }

    res.status(500).json({ message: 'Failed to post job' });
  }
};

// One-Click Apply (Seeker Only)
export const applyJob = async (req, res) => {
  try {
    if (req.user.role === 'recruiter') {
      return res.status(403).json({ message: 'Recruiters cannot apply for jobs' });
    }

    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });

    // Check if already applied
    const alreadyApplied = job.applicants.find(a => a.user.toString() === req.user.userId);
    if (alreadyApplied) return res.status(400).json({ message: 'Already applied' });

    job.applicants.push({ user: req.user.userId });
    await job.save();

    // Create Notification for recruiter
    try {
      await createAndEmitNotification(Notification, {
        recipient: job.recruiter,
        sender: req.user.userId,
        type: 'job_application',
        job: job._id
      });
    } catch (err) {
      console.error("Error creating notification for job application", err);
    }

    res.json({ message: 'Successfully applied' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to apply' });
  }
};

// Update Application Status (Recruiter Only)
export const updateApplicationStatus = async (req, res) => {
  try {
    const { status } = req.body; // "Reviewed", "Hired", "Rejected"
    const job = await Job.findById(req.params.id);
    
    if (!job) return res.status(404).json({ message: 'Job not found' });
    
    // Verify this recruiter owns this job
    if (job.recruiter.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized to modity this job' });
    }

    const applicant = job.applicants.id(req.params.applicantId);
    if (!applicant) return res.status(404).json({ message: 'Applicant not found' });

    applicant.status = status;
    await job.save();

    // Create Notification for the applicant
    try {
      await createAndEmitNotification(Notification, {
        recipient: applicant.user,
        sender: req.user.userId,
        type: 'job_status_update',
        message: status,
        job: job._id
      });
    } catch (err) {
      console.error("Error creating notification for applicant status update", err);
    }

    res.json({ message: `Applicant status updated to ${status}`, job });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update status' });
  }
};