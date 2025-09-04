import "./styles/fonts.css";
import "./App.css";
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { config } from './config/wagmi'
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import Dashboard from './pages/Dashboard';
import RitualsPage from './pages/home/ritual';
import RitualDetailPage from './pages/home/ritualDetail';
import NodesPage from './pages/home/nodes';
import NodeDetailPage from './pages/home/nodeDetail';

const queryClient = new QueryClient()

function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <Router>
          <div className="app">
            <Header />
            <main className="main-content">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/rituals" element={<RitualsPage />} />
                <Route path="/ritual/:id" element={<RitualDetailPage />} />
                <Route path="/rituals/:id" element={<RitualDetailPage />} />
                <Route path="/nodes" element={<NodesPage />} />
                <Route path="/node/:address" element={<NodeDetailPage />} />
                <Route path="/staker/:address" element={<NodeDetailPage />} />
                <Route path="/stakers" element={<NodesPage />} />
                <Route path="/address/:address" element={<NodeDetailPage />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </Router>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;
