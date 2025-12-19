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
    <div className="w-screen h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Floating Header */}
      <div 
        className={`fixed top-0 left-0 right-0 bg-slate-900/95 backdrop-blur-xl border-b border-purple-500/20 shadow-2xl z-50 transition-all duration-300 ease-in-out ${
          showHeader ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'
        }`}
      >
        <div className="px-6 py-4 flex justify-between items-center flex-wrap gap-4">
          {/* Left Section */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Code<span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">Share</span>
              </h2>
            </div>
            
            <div className="flex items-center gap-3 px-4 py-2 bg-purple-500/10 border border-purple-500/30 rounded-xl hover:bg-purple-500/20 transition-all duration-300">
              <span className="font-mono font-bold text-purple-300 text-sm tracking-wider">{roomId}</span>
              <button 
                onClick={copyRoomLink} 
                className="px-3 py-1 bg-purple-500/20 hover:bg-purple-500/30 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95"
                title="Copy room link"
              >
                {copied ? (
                  <span className="text-green-400 text-sm font-medium">✓ Copied</span>
                ) : (
                  <svg className="w-4 h-4 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          
          {/* Right Section */}
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm border transition-all duration-300 ${
              isConnected 
                ? 'bg-green-500/10 border-green-500/30 text-green-300' 
                : 'bg-red-500/10 border-red-500/30 text-red-300'
            }`}>
              <span className={`w-2 h-2 rounded-full animate-pulse ${
                isConnected ? 'bg-green-400 shadow-[0_0_10px_rgba(34,197,94,0.8)]' : 'bg-red-400 shadow-[0_0_10px_rgba(239,68,68,0.8)]'
              }`}></span>
              {isConnected ? 'Live' : 'Connecting'}
            </div>
            
            <button 
              onClick={leaveRoom} 
              className="px-5 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg hover:shadow-red-500/50"
            >
              Leave Room
            </button>
          </div>
        </div>
      </div>

      {/* Code Editor */}
      <textarea
        className="w-full h-full pt-24 pb-8 px-8 bg-slate-900 text-slate-200 font-mono text-base leading-relaxed resize-none outline-none border-none placeholder-slate-500 selection:bg-purple-500/30"
        style={{
          fontFamily: "'Fira Code', 'Courier New', 'Monaco', monospace",
          caretColor: '#a78bfa'
        }}
        value={code}
        onChange={handleCodeChange}
        placeholder="Start typing anywhere... Your code syncs in real-time! 🚀

Move your mouse to show the header with room controls.

Tips:
• Share the room ID with collaborators
• All changes are saved automatically
• Works across multiple devices simultaneously"
        spellCheck="false"
        autoFocus
      />

      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        textarea::-webkit-scrollbar {
          width: 12px;
          height: 12px;
        }
        
        textarea::-webkit-scrollbar-track {
          background: #1e293b;
        }
        
        textarea::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%);
          border-radius: 6px;
        }
        
        textarea::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, #7c3aed 0%, #2563eb 100%);
        }

        @media (max-width: 768px) {
          textarea {
            padding-top: 120px;
            padding-left: 16px;
            padding-right: 16px;
            font-size: 14px;
          }
        }
      `}</style>
    </div>
  );
}

export default Room;