import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { database } from '../firebase';
import { ref, set, onValue, push, remove } from 'firebase/database';

function Room() {
  const [code, setCode] = useState('');
  const [images, setImages] = useState({});
  const [isConnected, setIsConnected] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showHeader, setShowHeader] = useState(true);
  const [uploading, setUploading] = useState(false);
  const { roomId } = useParams();
  const navigate = useNavigate();
  const isLocalUpdate = useRef(false);
  const hideHeaderTimer = useRef(null);
  const fileInputRef = useRef(null);

  // Sync code from Firebase
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

  // Sync images from Firebase
  useEffect(() => {
    if (!roomId) return;

    const imagesRef = ref(database, `rooms/${roomId}/images`);
    
    const unsubscribe = onValue(imagesRef, (snapshot) => {
      const data = snapshot.val();
      setImages(data || {});
    });

    return () => unsubscribe();
  }, [roomId]);

  // Auto-hide header on mouse inactivity
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

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }

    setUploading(true);

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result;
      const imagesRef = ref(database, `rooms/${roomId}/images`);
      const newImageRef = push(imagesRef);
      
      set(newImageRef, {
        data: base64String,
        timestamp: Date.now(),
        name: file.name
      }).then(() => {
        setUploading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }).catch((error) => {
        console.error('Error uploading image:', error);
        alert('Failed to upload image. It might be too large.');
        setUploading(false);
      });
    };

    reader.onerror = () => {
      alert('Failed to read image file');
      setUploading(false);
    };

    reader.readAsDataURL(file);
  };

  const deleteImage = (imageId) => {
    if (!roomId) return;
    const imageRef = ref(database, `rooms/${roomId}/images/${imageId}`);
    remove(imageRef).catch((error) => {
      console.error('Error deleting image:', error);
    });
  };

  const copyImage = async (imageData) => {
    try {
      const response = await fetch(imageData);
      const blob = await response.blob();
      
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob
        })
      ]);
      
      alert('Image copied to clipboard!');
    } catch (error) {
      console.error('Error copying image:', error);
      alert('Failed to copy image. Your browser may not support this feature.');
    }
  };

  const downloadImage = (imageData, imageName) => {
    const link = document.createElement('a');
    link.href = imageData;
    link.download = imageName || 'image.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

  const imageArray = Object.entries(images).map(([id, data]) => ({ id, ...data }));

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

      {/* Main Content Area */}
      <div className="flex h-full pt-24">
        {/* Code Editor */}
        <div className="flex-1 relative">
          <textarea
            className="w-full h-full px-8 py-8 bg-slate-900 text-slate-200 font-mono text-base leading-relaxed resize-none outline-none border-none placeholder-slate-500 selection:bg-purple-500/30"
            style={{
              fontFamily: "'Fira Code', 'Courier New', 'Monaco', monospace",
              caretColor: '#a78bfa'
            }}
            value={code}
            onChange={handleCodeChange}
            placeholder="Start typing your code here... 🚀

Your code syncs in real-time across all devices!

Tips:
• Share the room ID with collaborators
• Upload images using the button on the right
• All changes are saved automatically"
            spellCheck="false"
            autoFocus
          />
        </div>

        {/* Images Sidebar */}
        <div className="w-96 bg-slate-800/50 backdrop-blur-sm border-l border-purple-500/20 flex flex-col">
          {/* Upload Section */}
          <div className="p-4 border-b border-purple-500/20">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
              disabled={uploading}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Uploading...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Upload Image
                </>
              )}
            </button>
            <p className="text-xs text-gray-400 mt-2 text-center">Max 5MB • PNG, JPG, GIF</p>
          </div>

          {/* Images List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {imageArray.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 text-center px-4">
                <svg className="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-sm">No images yet</p>
                <p className="text-xs mt-2">Upload images to share with everyone in this room</p>
              </div>
            ) : (
              imageArray.sort((a, b) => b.timestamp - a.timestamp).map(({ id, data, name }) => (
                <div key={id} className="bg-slate-900/50 rounded-xl overflow-hidden border border-purple-500/20 hover:border-purple-500/40 transition-all duration-300">
                  <div className="relative group">
                    <img 
                      src={data} 
                      alt={name} 
                      className="w-full h-64 object-cover"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2">
                      <button
                        onClick={() => copyImage(data)}
                        className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-all duration-200 hover:scale-110"
                        title="Copy image"
                      >
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => downloadImage(data, name)}
                        className="p-2 bg-green-600 hover:bg-green-700 rounded-lg transition-all duration-200 hover:scale-110"
                        title="Download image"
                      >
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </button>
                      <button
                        onClick={() => deleteImage(id)}
                        className="p-2 bg-red-600 hover:bg-red-700 rounded-lg transition-all duration-200 hover:scale-110"
                        title="Delete image"
                      >
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="text-sm text-gray-300 truncate">{name}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(Date.now()).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        textarea::-webkit-scrollbar,
        div::-webkit-scrollbar {
          width: 12px;
          height: 12px;
        }
        
        textarea::-webkit-scrollbar-track,
        div::-webkit-scrollbar-track {
          background: #1e293b;
        }
        
        textarea::-webkit-scrollbar-thumb,
        div::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%);
          border-radius: 6px;
        }
        
        textarea::-webkit-scrollbar-thumb:hover,
        div::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, #7c3aed 0%, #2563eb 100%);
        }

        @media (max-width: 1024px) {
          .flex {
            flex-direction: column;
          }
          
          .w-96 {
            width: 100%;
            max-height: 50vh;
          }
          
          textarea {
            font-size: 14px;
          }
        }
      `}</style>
    </div>
  );
}

export default Room;