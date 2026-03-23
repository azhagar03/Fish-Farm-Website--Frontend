// src/App.jsx - Main App with routing
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import AdminPanel from './pages/AdminPanel';
import BubblesBg from './components/BubblesBg';

function App() {
  return (
    <>
      <BubblesBg />
      <Routes>
        <Route path="/" element={<><Navbar /><HomePage /></>} />
        <Route path="/admin/*" element={<AdminPanel />} />
      </Routes>
    </>
  );
}

export default App;
