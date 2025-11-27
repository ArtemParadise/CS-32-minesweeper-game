import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import GamePage from './pages/Game/index.jsx';

function App() {
  return (
    <Routes>
      {/* Головна сторінка */}
      <Route path="/" element={<Navigate to="/game" replace />} />

      {/* Play Game page */}
      <Route path="/game" element={<GamePage />} />

      {/* Старе посилання, щоб не ламати структуру */}
      <Route path="/zyryanova-khrystyna" element={<GamePage />} />

      {/* Якщо маршрут не знайдено → перенаправити на гру */}
      <Route path="*" element={<Navigate to="/game" replace />} />
    </Routes>
  );
}

export default App;


