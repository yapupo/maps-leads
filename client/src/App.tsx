import { Routes, Route, Navigate } from 'react-router-dom';
import { Dashboard }  from './pages/Dashboard';
import { Leads }      from './pages/Leads';
import { Scrape }     from './pages/Scrape';
import { Send }       from './pages/Send';
import { Analytics }  from './pages/Analytics';
import { History }    from './pages/History';
import { Automation } from './pages/Automation';

export default function App() {
  return (
    <Routes>
      <Route path="/"           element={<Dashboard />} />
      <Route path="/leads"      element={<Leads />} />
      <Route path="/scrape"     element={<Scrape />} />
      <Route path="/send"       element={<Send />} />
      <Route path="/analytics"  element={<Analytics />} />
      <Route path="/history"    element={<History />} />
      <Route path="/automation" element={<Automation />} />
      <Route path="*"           element={<Navigate to="/" replace />} />
    </Routes>
  );
}
