import { NextPage } from 'next';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Seo } from '../components/Seo';
import { HistoryPage } from '../components/HistoryPage';

const HistoryRoute: NextPage = () => {
  return (
    <DashboardLayout>
      <Seo title="History" description="Your previously generated models, routes, and validators." noindex />
      <h1 className="text-xl font-bold text-[#c0c1ff] mb-1">Generation History</h1>
      <p className="text-sm text-[#c7c4d7] mb-6">Your previously generated models, routes, and validators.</p>
      <HistoryPage />
    </DashboardLayout>
  );
};

export default HistoryRoute;
