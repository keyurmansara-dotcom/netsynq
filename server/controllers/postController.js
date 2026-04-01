import Post from '../models/Post.js';

// Get Feed (Paginated)
export const getFeed = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 2;
    const skip = (page - 1) * limit;

    const posts = await Post.find({})
      .populate('author', 'name profile.headline')
      .populate('comments.user', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching feed' });
  }
};

// Create Post
export const createPost = async (req, res) => {
  const { content, mediaUrl } = req.body;
  try {
    const newPost = new Post({
      author: req.user.userId,
      content,
      mediaUrl
    });
    const savedPost = await newPost.save();
    res.status(201).json(savedPost);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create post' });
  }
};

// Like / Unlike Post logic
export const toggleLike = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const index = post.likes.indexOf(req.user.userId);
    if (index === -1) {
      post.likes.push(req.user.userId); // Like
    } else {
      post.likes.splice(index, 1);     // Unlike
    }

    await post.save();
    res.json(post.likes);
  } catch (error) {
    res.status(500).json({ message: 'Error updating like status' });
  }
};