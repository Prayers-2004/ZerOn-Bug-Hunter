import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Home from './pages/Home';
import ScanDashboard from './pages/ScanDashboard';
import Results from './pages/Results';
import Navigation from './components/Navigation';

function App() {
  return (
    <Router>
      <div className="App">
        <Navigation />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/scan/:scanId" element={<ScanDashboard />} />
          <Route path="/results/:scanId" element={<Results />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
