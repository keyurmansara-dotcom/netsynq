import User from '../models/User.js';

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
    
    user.profile = {
      headline: req.body.headline || user.profile.headline,
      location: req.body.location || user.profile.location,
      resumeUrl: req.body.resumeUrl || user.profile.resumeUrl,
      companyName: req.body.companyName || user.profile.companyName,
    };

    const updatedUser = await user.save();
    
    // Do not return password
    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      profile: updatedUser.profile
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error while updating' });
  }
};