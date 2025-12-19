import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { database } from '../firebase';
import { ref, set, onValue } from 'firebase/database';

function Room() {
  const [code, setCode] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showHeader, setShowHeader] = useState(true);
  const { roomId } = useParams();
  const navigate = useNavigate();
  const isLocalUpdate = useRef(false);
  const hideHeaderTimer = useRef(null);

  useEffect(() => {
    if (!roomId) return;

    const codeRef = ref(database, `rooms/${roomId}/code`);
    
    const unsubscribe = onValue(codeRef, (snapshot) => {
      setIsConnected(true);
      
      if (!isLocalUpdate.current) {
        const data = snapshot.val();
        setCode(data || '');
      }
      isLocalUpdate.current = false;
    }, (error) => {
      console.error('Firebase connection error:', error);
      setIsConnected(false);
    });

    return () => unsubscribe();
  }, [roomId]);

  useEffect(() => {
    const handleMouseMove = () => {
      setShowHeader(true);
      
      if (hideHeaderTimer.current) {
        clearTimeout(hideHeaderTimer.current);
      }
      
      hideHeaderTimer.current = setTimeout(() => {
        setShowHeader(false);
      }, 3000);
    };

    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (hideHeaderTimer.current) {
        clearTimeout(hideHeaderTimer.current);
      }
    };
  }, []);

  const handleCodeChange = (e) => {
    const newCode = e.target.value;
    setCode(newCode);
    isLocalUpdate.current = true;
    
    if (roomId) {
      const codeRef = ref(database, `rooms/${roomId}/code`);
      set(codeRef, newCode).catch((error) => {
        console.error('Error updating code:', error);
      });
    }
  };

  const copyRoomLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const leaveRoom = () => {
    navigate('/');
  };

  return (
    <div className="room-container">
      <div className={`floating-header ${showHeader ? 'visible' : 'hidden'}`}>
        <div className="header-content">
          <div className="header-left">
            <h2>🔥 Code Share</h2>
            <div className="room-id-badge">
              <span className="room-id">{roomId}</span>
              <button onClick={copyRoomLink} className="btn-copy">
                {copied ? '✓' : '📋'}
              </button>
            </div>
          </div>
          
          <div className="header-right">
            <div className={`status ${isConnected ? 'connected' : 'disconnected'}`}>
              <span className="status-dot"></span>
              {isConnected ? 'Live' : 'Connecting'}
            </div>
            <button onClick={leaveRoom} className="btn-leave">
              Leave
            </button>
          </div>
        </div>
      </div>

      <textarea
        className="fullscreen-editor"
        value={code}
        onChange={handleCodeChange}
        placeholder="Start typing anywhere... Your code syncs in real-time! (Move mouse to show header)"
        spellCheck="false"
        autoFocus
      />
    </div>
  );
}

export default Room;
