import { useState } from 'react'


// App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/home'; // Adjust path if needed

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
    </BrowserRouter>
  );
}

