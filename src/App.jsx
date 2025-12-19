import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import Room from './components/Room';
import AllRooms from './components/AllRooms';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/room/:roomId" element={<Room />} />
        <Route path="/allrooms" element={<AllRooms />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
