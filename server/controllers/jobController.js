import Job from '../models/Job.js';

// Get AI Recommended Jobs or all jobs (New Feature Logic Placeholder)
export const getJobs = async (req, res) => {
  try {
    const jobs = await Job.find({}).populate('recruiter', 'name profile.companyName');
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: 'Server Error fetching jobs' });
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

    res.json({ message: 'Successfully applied' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to apply' });
  }
};