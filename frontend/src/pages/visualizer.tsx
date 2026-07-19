import type { NextPage } from 'next';
import { useSelector } from 'react-redux';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Seo } from '../components/Seo';
import { SchemaVisualizer } from '../components/workspace/SchemaVisualizer';
import { parseSchema } from '@/lib/parseSchema';
import type { RootState } from '../store/store';

const VisualizerPage: NextPage = () => {
  const source = useSelector((state: RootState) => state.generation.source);
  const entities = source.trim() ? parseSchema(source) : null;

  return (
    <DashboardLayout>
      <Seo
        title="Schema Visualizer"
        description="Interactive Entity-Relationship diagram of your generated database schema."
        noindex
      />
      <h1 className="text-xl font-bold text-[#c0c1ff] mb-1">Schema Visualizer</h1>
      <p className="text-sm text-[#c7c4d7] mb-6">
        Interactive Entity-Relationship diagram derived from your source schema. Foreign-key
        fields are linked to their referenced tables.
      </p>

      {entities && entities.length > 0 ? (
        <SchemaVisualizer entities={entities} />
      ) : (
        <div className="flex-1 flex items-center justify-center rounded-lg border border-dashed border-[#222a3d] bg-[#131b2e] py-20">
          <div className="text-center max-w-sm">
            <p className="text-sm font-medium text-[#dae2fd] mb-1">No schema to visualize</p>
            <p className="text-xs text-[#c7c4d7]">
              Paste a legacy schema or JSON on the{' '}
              <a href="/" className="text-[#c0c1ff] hover:underline">
                workspace
              </a>{' '}
              and generate code first. The diagram is built from the source you provide.
            </p>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default VisualizerPage;