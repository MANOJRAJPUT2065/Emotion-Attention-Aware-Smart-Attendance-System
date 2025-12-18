import React, { useEffect, useState } from 'react';
import '../communityPage.css';

const DMPanel = ({ onUserSelect, activeUser }) => {
    const [users, setUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredUsers, setFilteredUsers] = useState([]);

    const currentUser = localStorage.getItem('username');
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await fetch('http://localhost:5000/api/users'); // Adjust the endpoint as necessary
                const data = await response.json();
                if (Array.isArray(data)) {
                    const filtered = data.filter(user => user !== currentUser);
                    setUsers(filtered);
                } else {
                    console.error('Expected an array but got:', data);
                    setUsers([]);
                }
            } catch (error) {
                console.error('Error fetching users:', error);
            }
        };

        fetchUsers();
    }, [currentUser]);

    useEffect(() => {
        if (searchTerm) {
            const filtered = users.filter(user =>
                user.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredUsers(filtered);
        } else {
            setFilteredUsers([]);
        }
    }, [searchTerm, users]);

    return (
        <div className="chat-panel">
            <h3 className='channel-details panel-header'>USERS</h3>
            <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
            />
            {filteredUsers.length > 0 && (
                <ul className="suggestions-dropdown">
                    {filteredUsers.map((user, index) => (
                        <li
                            key={index}
                            className={`channel dm ${user === activeUser ? 'active' : ''}`}
                            onClick={() => onUserSelect(user)}
                        >
                            {user}
                        </li>
                    ))}
                </ul>
            )}
            <ul>
                {users.map((user, index) => (
                    <li
                        key={index}
                        className={`channel dm ${user === activeUser ? 'active' : ''}`}
                        onClick={() => onUserSelect(user)}
                    >
                        {user}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default DMPanel;
