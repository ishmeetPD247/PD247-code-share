import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Home() {
  const [roomId, setRoomId] = useState('');
  const navigate = useNavigate();

  const joinRoom = () => {
    if (roomId.trim()) {
      navigate(`/room/${roomId.trim()}`);
    }
  };

  const createRoom = () => {
    const newRoomId = Math.random().toString(36).substring(2, 9);
    navigate(`/room/${newRoomId}`);
  };

  return (
    <div className="app">
      <div className="home-container">
        <div className="home-card">
          <h1>🔥 Code Share</h1>
          <p className="subtitle">Share code in real-time across multiple screens</p>
          
          <div className="home-actions">
            <div className="input-group">
              <input
                type="text"
                placeholder="Enter Room ID"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && joinRoom()}
              />
              <button onClick={joinRoom} className="btn-primary">
                Join Room
              </button>
            </div>
            
            <div className="divider">
              <span>OR</span>
            </div>
            
            <button onClick={createRoom} className="btn-secondary">
              Create New Room
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
