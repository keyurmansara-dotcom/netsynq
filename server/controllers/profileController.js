import User from '../models/User.js';

const normalizeArray = (value) => {
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

const normalizeObjectArray = (value) => {
  if (Array.isArray(value)) {
    return value.filter((item) => item && Object.values(item).some(Boolean));
  }

  return [];
};

// Get Current User Profile
export const getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Update Profile
export const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    const currentProfile = user.profile || {};
    
    user.profile = {
      headline: req.body.headline || currentProfile.headline || '',
      location: req.body.location || currentProfile.location || '',
      resumeUrl: Object.prototype.hasOwnProperty.call(req.body, 'resumeUrl')
        ? (req.body.resumeUrl || '')
        : (currentProfile.resumeUrl || ''),
      companyName: req.body.companyName || currentProfile.companyName || '',
      summary: req.body.summary || currentProfile.summary || '',
      website: req.body.website || currentProfile.website || '',
      industry: req.body.industry || currentProfile.industry || '',
      avatarUrl: req.body.avatarUrl || currentProfile.avatarUrl || ''
    };

    if (Object.prototype.hasOwnProperty.call(req.body, 'skills')) {
      user.skills = normalizeArray(req.body.skills);
    }

    if (Object.prototype.hasOwnProperty.call(req.body, 'experience')) {
      user.experience = normalizeObjectArray(req.body.experience);
    }

    if (Object.prototype.hasOwnProperty.call(req.body, 'education')) {
      user.education = normalizeObjectArray(req.body.education);
    }

    if (Object.prototype.hasOwnProperty.call(req.body, 'projects')) {
      user.projects = normalizeObjectArray(req.body.projects);
    }

    if (Object.prototype.hasOwnProperty.call(req.body, 'links')) {
      user.links = {
        github: req.body.links?.github || '',
        portfolio: req.body.links?.portfolio || '',
        linkedin: req.body.links?.linkedin || '',
        website: req.body.links?.website || ''
      };
    }

    if (Object.prototype.hasOwnProperty.call(req.body, 'privacy')) {
      user.privacy = {
        ...(user.privacy || {}),
        profileVisibility: req.body.privacy?.profileVisibility || user.privacy?.profileVisibility || 'public',
        searchable: typeof req.body.privacy?.searchable === 'boolean' ? req.body.privacy.searchable : (user.privacy?.searchable ?? true),
        showResume: typeof req.body.privacy?.showResume === 'boolean' ? req.body.privacy.showResume : (user.privacy?.showResume ?? true),
        allowConnectionRequests: typeof req.body.privacy?.allowConnectionRequests === 'boolean' ? req.body.privacy.allowConnectionRequests : (user.privacy?.allowConnectionRequests ?? true)
      };
    }

    if (Object.prototype.hasOwnProperty.call(req.body, 'openToWork')) {
      user.openToWork = Boolean(req.body.openToWork);
    }

    const updatedUser = await user.save();
    
    // Do not return password
    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      profile: updatedUser.profile,
      skills: updatedUser.skills,
      experience: updatedUser.experience,
      education: updatedUser.education,
      projects: updatedUser.projects,
      links: updatedUser.links,
      privacy: updatedUser.privacy,
      openToWork: updatedUser.openToWork
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error while updating' });
  }
};