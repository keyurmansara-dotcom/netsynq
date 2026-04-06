import Notification from '../models/Notification.js';
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
      .populate('likes', 'name')
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

// Update Post
export const updatePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    if (post.author.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized to edit this post' });
    }

    if (req.body.content !== undefined) post.content = req.body.content;
    if (req.body.mediaUrl !== undefined) post.mediaUrl = req.body.mediaUrl;

    await post.save();
    // Re-populate author to return fully formed post
    await post.populate('author', 'name profile.headline');
    await post.populate('comments.user', 'name');
    await post.populate('likes', 'name');
    
    res.json(post);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update post' });
  }
};

// Delete Post
export const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    if (post.author.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized to delete this post' });
    }

    await Post.findByIdAndDelete(req.params.id);
    res.json({ message: 'Post removed' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete post' });
  }
};

// Like / Unlike Post logic
export const toggleLike = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const index = post.likes.findIndex(id => id.toString() === String(req.user.userId));
    if (index === -1) {
      post.likes.push(req.user.userId); // Like
      // Notify the author (including self, for easier testing!)
      await Notification.create({
        recipient: post.author,
        sender: req.user.userId,
        type: 'like',
        post: post._id
      });
    } else {
      post.likes.splice(index, 1);     // Unlike
    }

    await post.save();
    await post.populate('likes', 'name');
    res.json(post.likes);
  } catch (error) {
    res.status(500).json({ message: 'Error updating like status' });
  }
};

// Add Comment
export const addComment = async (req, res) => {
  try {
    const { text } = req.body;
    const post = await Post.findById(req.params.id);
    
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const comment = { user: req.user.userId, text };
    post.comments.push(comment);
    await post.save();

    // Create Notification (including self for easier testing)
    await Notification.create({
      recipient: post.author,
      sender: req.user.userId,
      type: 'comment',
      post: post._id
    });

    const populatedPost = await Post.findById(post._id)
      .populate('comments.user', 'name profile.headline');

    res.json(populatedPost.comments);
  } catch (error) {
    res.status(500).json({ message: 'Error adding comment' });
  }
};

// Delete Comment
export const deleteComment = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    // Find the comment
    const comment = post.comments.find(c => c._id.toString() === req.params.commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    // Make sure the user is the comment author or post author
    if (comment.user.toString() !== req.user.userId && post.author.toString() !== req.user.userId) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // Remove the comment
    post.comments = post.comments.filter(c => c._id.toString() !== req.params.commentId);
    await post.save();

    const populatedPost = await Post.findById(post._id)
      .populate('comments.user', 'name profile.headline');

    res.json(populatedPost.comments);
  } catch (error) {
    res.status(500).json({ message: 'Error deleting comment' });
  }
};