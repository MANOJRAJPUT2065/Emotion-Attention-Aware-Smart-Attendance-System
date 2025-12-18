const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
    sender: {
        type: String,
        required: true,
    },
    receiver: {  
        type: String,
        required: true,
    },
    message: {
        type: String,
        required: true,
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
});

const DirectMessageSchema = new mongoose.Schema({
    participants: {
        type: [String],  
        required: true,
        validate: {
            validator: function (value) {
                return value.length === 2;  
            },
            message: 'There must be exactly two participants.',
        },
    },
    messages: [MessageSchema],  
});

DirectMessageSchema.methods.getOtherParticipant = function (username) {
    return this.participants.find(participant => participant !== username);
};

module.exports = mongoose.model('DirectMessage', DirectMessageSchema);
