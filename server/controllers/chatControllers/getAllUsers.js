const User = require('../../models/userModel');

const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({}, 'username'); 
        res.status(200).json(users.map(user => user.username)); 
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users.' });
    }
};

module.exports = { getAllUsers };
