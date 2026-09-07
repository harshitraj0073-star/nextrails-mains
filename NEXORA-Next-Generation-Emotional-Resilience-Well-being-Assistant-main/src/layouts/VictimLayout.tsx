import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from '../components/Header';
import { SpatialNav } from '../components/SpatialNav';

export const VictimLayout: React.FC = () => {
  const [navOpen, setNavOpen] = useState(false);

  return (
    <div className="sentient-layout">
      <SpatialNav open={navOpen} onClose={() => setNavOpen(false)} />
      <div className="sentient-main-panel">
        <Header onMenu={() => setNavOpen(true)} />
        <main className="route-canvas">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
