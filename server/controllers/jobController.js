import Job from '../models/Job.js';
import Notification from '../models/Notification.js';

// Get AI Recommended Jobs or all jobs (New Feature Logic Placeholder)
export const getJobs = async (req, res) => {
  try {
    const jobs = await Job.find({}).populate('recruiter', 'name profile.companyName').sort({ createdAt: -1 });
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
      .sort({ createdAt: -1 });
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: 'Server Error fetching recruiter jobs' });
  }
};

// Create a Job (Recruiter Only)
export const createJob = async (req, res) => {
  const { title, company, location, description, skillsRequired, type } = req.body;
  try {
    const job = new Job({
      recruiter: req.user.userId,
      title,
      company,
      location,
      description,
      skillsRequired,
      type
    });
    const createdJob = await job.save();
    res.status(201).json(createdJob);
  } catch (error) {
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
      await Notification.create({
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
      await Notification.create({
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