import Company from '../models/Company.js';
import Job from '../models/Job.js';
import Post from '../models/Post.js';
import User from '../models/User.js';

const normalizeQuery = (value) => String(value || '').trim();

const visibleUserFilter = (currentUserId) => ({
  $or: [
    { _id: currentUserId },
    { 'privacy.searchable': true },
    { privacy: { $exists: false } }
  ]
});

export const searchEverything = async (req, res) => {
  try {
    const query = normalizeQuery(req.query.q);
    if (!query) {
      return res.json({ users: [], jobs: [], posts: [], companies: [] });
    }

    const searchRegex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

    const [users, jobs, posts, companies] = await Promise.all([
      User.find({
        $and: [
          visibleUserFilter(req.user.userId),
          {
            $or: [
              { name: searchRegex },
              { email: searchRegex },
              { 'profile.headline': searchRegex },
              { 'profile.location': searchRegex },
              { skills: searchRegex },
              { 'links.github': searchRegex },
              { 'links.portfolio': searchRegex },
              { 'links.linkedin': searchRegex }
            ]
          }
        ]
      })
        .select('name email role profile skills links openToWork privacy')
        .limit(20),
      Job.find({
        $or: [
          { title: searchRegex },
          { company: searchRegex },
          { location: searchRegex },
          { description: searchRegex },
          { skillsRequired: searchRegex }
        ]
      })
        .populate('recruiter', 'name profile.companyName')
        .populate('companyId', 'name logoUrl website description industry location employeeCount')
        .sort({ createdAt: -1 })
        .limit(20),
      Post.find({
        $or: [
          { content: searchRegex },
          { mediaUrl: searchRegex }
        ]
      })
        .populate('author', 'name profile.headline profile.companyName')
        .populate('comments.user', 'name')
        .populate('likes', 'name')
        .sort({ createdAt: -1 })
        .limit(20),
      Company.find({
        $or: [
          { name: searchRegex },
          { description: searchRegex },
          { industry: searchRegex },
          { location: searchRegex }
        ]
      })
        .limit(20)
    ]);

    return res.json({ users, jobs, posts, companies });
  } catch (error) {
    console.error('Search error:', error);
    return res.status(500).json({ message: 'Failed to search platform data' });
  }
};