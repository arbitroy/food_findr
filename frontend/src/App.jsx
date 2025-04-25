import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import HomePage from './pages/HomePage';
import SearchPage from './pages/SearchPage';
import RestaurantPage from './pages/RestaurantPage';
import NotFoundPage from './pages/NotFoundPage';
import { SearchProvider } from './context/SearchContext';

function App() {
  return (
    <Router>
      <SearchProvider>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<HomePage />} />
            <Route path="search" element={<SearchPage />} />
            <Route path="restaurant/:id" element={<RestaurantPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </SearchProvider>
    </Router>
  );
}

export default App;