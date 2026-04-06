import User from '../models/User.js';

export const getNetworkData = async (req, res) => {
  try {
    const currentUserId = req.user.userId;
    
    const currentUser = await User.findById(currentUserId)
      .populate('connectionRequests', 'name profile.headline email _id')
      .populate('connections', 'name profile.headline email _id')
      .populate('followers', 'name profile.headline email _id')
      .populate('following', 'name profile.headline email _id')
      .populate('sentRequests', '_id');
      
    if (!currentUser) return res.status(404).json({ message: 'User not found' });

    // Exclude users already connected with, or pending request from/to, or myself
    const excludedIds = [
      currentUserId,
      ...(currentUser.connections?.map(c => c._id) || []),
      ...(currentUser.connectionRequests?.map(c => c._id) || []),
      ...(currentUser.sentRequests?.map(c => c._id) || [])
    ];

    const suggestions = await User.find({ _id: { $nin: excludedIds } })
      .select('name profile.headline email _id')
      .limit(10); // Show max 10 suggestions

    res.json({
      connections: currentUser.connections,
      followers: currentUser.followers || [],
      following: currentUser.following || [],
      requests: currentUser.connectionRequests,
      suggestions: suggestions,
      sentRequests: currentUser.sentRequests
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Configuration Error' });
  }
};

export const sendRequest = async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.user.userId;

    if (targetUserId === currentUserId) {
        return res.status(400).json({ message: "You cannot connect with yourself." });
    }

    const targetUser = await User.findById(targetUserId);
    const currentUser = await User.findById(currentUserId);

    if (!targetUser || !currentUser) return res.status(404).json({ message: 'User not found' });

    // Avoid duplicate requests
    if (targetUser.connectionRequests.includes(currentUserId)) {
      return res.status(400).json({ message: 'Request already sent' });
    }
    
    // Check if they are already connected
    if (targetUser.connections.includes(currentUserId)) {
        return res.status(400).json({ message: 'Already connected' });
    }

    targetUser.connectionRequests.push(currentUserId);
    currentUser.sentRequests.push(targetUserId);

    await targetUser.save();
    await currentUser.save();

    res.status(200).json({ message: 'Connection request sent successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const acceptRequest = async (req, res) => {
  try {
    const requesterId = req.params.id; // User who sent the request
    const currentUserId = req.user.userId;

    const currentUser = await User.findById(currentUserId);
    const requesterUser = await User.findById(requesterId);

    if (!currentUser || !requesterUser) return res.status(404).json({ message: 'User not found' });

    if (!currentUser.connectionRequests.includes(requesterId)) {
        return res.status(400).json({ message: "No such connection request" });
    }

    // Add to each other's connections
    currentUser.connections.push(requesterId);
    requesterUser.connections.push(currentUserId);

    // Remove from arrays
    currentUser.connectionRequests = currentUser.connectionRequests.filter(id => id.toString() !== requesterId);
    requesterUser.sentRequests = requesterUser.sentRequests.filter(id => id.toString() !== currentUserId);

    await currentUser.save();
    await requesterUser.save();

    res.status(200).json({ message: 'Connection request accepted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const declineRequest = async (req, res) => {
    try {
        const requesterId = req.params.id;
        const currentUserId = req.user.userId;
    
        const currentUser = await User.findById(currentUserId);
        const requesterUser = await User.findById(requesterId);
    
        if (!currentUser || !requesterUser) return res.status(404).json({ message: 'User not found' });
    
        // Remove from arrays
        currentUser.connectionRequests = currentUser.connectionRequests.filter(id => id.toString() !== requesterId);
        requesterUser.sentRequests = requesterUser.sentRequests.filter(id => id.toString() !== currentUserId);
    
        await currentUser.save();
        await requesterUser.save();
    
        res.status(200).json({ message: 'Connection request declined' });
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
      }
};
