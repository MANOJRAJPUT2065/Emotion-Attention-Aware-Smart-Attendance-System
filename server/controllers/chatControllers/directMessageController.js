const DirectMessage = require('../../models/directMessageModel');

const getDirectMessages = async (req, res) => {
    const { user1, user2 } = req.params;

    try {
        const conversation = await DirectMessage.findOne({
            participants: { $all: [user1, user2] },
        });

        if (!conversation) {
            return res.status(404).json({ error: 'No conversation found between these users.' });
        }

        const otherUser = conversation.getOtherParticipant(user1); 
        res.status(200).json({ conversation, otherUser });
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve direct messages.' });
    }
};

const getDirectMessagesByOneUser = async (req, res) => {
    const { user1, user2 } = req.params;

    try {
        const conversation = await DirectMessage.findOne({
            participants: { $all: [user1, user2] },
        });

        if (!conversation) {
            return res.status(404).json({ error: 'No conversation found between these users.' });
        }

        res.status(200).json(conversation);
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve direct messages.' });
    }
};

const sendDirectMessage = async (req, res) => {
    const { user1, user2 } = req.params;
    const { sender, message } = req.body;

    console.log(`user1: ${user1}, user2: ${user2}, sender: ${sender}, message: ${message}`);

    if (sender !== user1 && sender !== user2) {
        return res.status(400).json({ error: 'Sender must be one of the participants.' });
    }

    try {
        let conversation = await DirectMessage.findOne({
            participants: { $all: [user1, user2] },
        });

        const receiver = sender === user1 ? user2 : user1;
        const messageObj = { sender, receiver, message }; 

        if (!conversation) {
            conversation = new DirectMessage({
                participants: [user1, user2],
                messages: [messageObj],
            });
        } else {
            conversation.messages.push(messageObj);
        }

        await conversation.save();
        res.status(200).json({ success: 'Message sent successfully.' });
    } catch (error) {
        console.error('Error sending direct message:', error);
        res.status(500).json({ error: 'Failed to send message. ' + error.message });
    }
};


module.exports = { getDirectMessages, sendDirectMessage, getDirectMessagesByOneUser };
