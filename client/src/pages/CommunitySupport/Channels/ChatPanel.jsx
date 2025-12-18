import React, { useEffect } from 'react';
import '../communityPage.css';

const ChatPanel = ({ onChannelChange, activeChannel }) => {
    useEffect(() => {
        const fetchDirectMessages = async () => {
            try {
                const username = localStorage.getItem('username');
                console.log(username)
                const response = await fetch('http://localhost:5000/api/direct-messages/' + username); // Adjust the endpoint as needed
                const messages = await response.json();
                console.log(messages);
            } catch (error) {
                console.error('Error fetching direct messages:', error);
            }
        };


        fetchDirectMessages();
    }, []);



    return (
        <div className="chat-panel">
            <h3 className='channel-details panel-header'>CHANNELS</h3>
            <div
                className={`channel ${activeChannel === 'General Support' ? 'active' : ''}`}
                onClick={() => onChannelChange('General Support')}
            >
                General Support
            </div>
            <div
                className={`channel ${activeChannel === 'Addiction Recovery' ? 'active' : ''}`}
                onClick={() => onChannelChange('Addiction Recovery')}
            >
                Addiction Recovery
            </div>
            <div
                className={`channel ${activeChannel === 'Friendly Talks' ? 'active' : ''}`}
                onClick={() => onChannelChange('Friendly Talks')}
            >
                Friendly Talks
            </div>
        </div>
    );
};

export default ChatPanel;
