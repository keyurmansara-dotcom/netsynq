import Notification from '../models/Notification.js';
import Post from '../models/Post.js';
import User from '../models/User.js';
import { createAndEmitNotification } from '../services/realtimeService.js';

// Get Feed (Paginated)
export const getFeed = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 5, 1), 25);
    const skip = (page - 1) * limit;

    const currentUser = await User.findById(req.user.userId).select('connections following privacy');
    const connectionIds = Array.isArray(currentUser?.connections) ? currentUser.connections.map((item) => item.toString()) : [];
    const followingIds = Array.isArray(currentUser?.following) ? currentUser.following.map((item) => item.toString()) : [];
    const priorityAuthorIds = Array.from(new Set([req.user.userId, ...connectionIds, ...followingIds]));

    const posts = await Post.find({})
      .populate('author', 'name profile.headline')
      .populate('comments.user', 'name')
      .populate('likes', 'name')
      .lean();

    const prioritized = posts
      .filter((post) => {
        const authorId = String(post.author?._id || post.author);
        return priorityAuthorIds.includes(authorId) || !currentUser?.privacy || currentUser.privacy.profileVisibility !== 'private';
      })
      .sort((left, right) => {
        const leftAuthor = String(left.author?._id || left.author);
        const rightAuthor = String(right.author?._id || right.author);
        const leftPriority = priorityAuthorIds.includes(leftAuthor) ? 1 : 0;
        const rightPriority = priorityAuthorIds.includes(rightAuthor) ? 1 : 0;

        if (leftPriority !== rightPriority) {
          return rightPriority - leftPriority;
        }

        return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
      });

    const pagedPosts = prioritized.slice(skip, skip + limit);

    res.json(pagedPosts);
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
      await createAndEmitNotification(Notification, {
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
    await createAndEmitNotification(Notification, {
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