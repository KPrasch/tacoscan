import "./styles/fonts.css";
import "./App.css";
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { config } from './config/wagmi'
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import NetworkSwitcher from './components/NetworkSwitcher';
// import TestnetNotice from './components/TestnetNotice';
import Dashboard from './pages/Dashboard';
import RitualsPage from './pages/home/ritual';
import RitualDetail from './pages/RitualDetail';
import NodesPage from './pages/home/nodes';
import NodeDetail from './pages/NodeDetail';
import NetworkActivity from './pages/NetworkActivity';
import SmartContracts from './pages/SmartContracts';
import HeartbeatGroupDetail from './pages/HeartbeatGroupDetail';
import SigningCohorts from './pages/SigningCohorts';
import SigningCohortDetail from './pages/SigningCohortDetail';
import Rewards from './pages/Rewards';
import Infractions from './pages/Infractions';

const queryClient = new QueryClient()

function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <Router>
          <div className="app">
            <Header />
            {/* <TestnetNotice /> */}
            <main className="main-content">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/rituals" element={<RitualsPage />} />
                <Route path="/ritual/:id" element={<RitualDetail />} />
                <Route path="/rituals/:id" element={<RitualDetail />} />
                <Route path="/heartbeat-group/:weekId" element={<HeartbeatGroupDetail />} />
                <Route path="/nodes" element={<NodesPage />} />
                <Route path="/node/:address" element={<NodeDetail />} />
                <Route path="/staker/:address" element={<NodeDetail />} />
                <Route path="/stakers" element={<NodesPage />} />
                <Route path="/address/:address" element={<NodeDetail />} />
                <Route path="/cohorts" element={<SigningCohorts />} />
                <Route path="/cohort/:id" element={<SigningCohortDetail />} />
                <Route path="/rewards" element={<Rewards />} />
                <Route path="/infractions" element={<Infractions />} />
                <Route path="/heartbeats" element={<RitualsPage defaultView="heartbeats" />} />
                <Route path="/activity" element={<NetworkActivity />} />
                <Route path="/contracts" element={<SmartContracts />} />
              </Routes>
            </main>
            <Footer />
            <NetworkSwitcher />
          </div>
        </Router>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;
