import type { NextPage } from 'next';
import { useDispatch } from 'react-redux';
import { useRouter } from 'next/router';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Seo } from '../components/Seo';
import { schemaTemplates, getTemplatesByCategory, templateCategories } from '@/data/templates';
import { setSource, setStatus } from '@/features/generation/generationSlice';

const TemplatesPage: NextPage = () => {
  const dispatch = useDispatch();
  const router = useRouter();

  const loadTemplate = (id: string) => {
    const template = schemaTemplates.find((t) => t.id === id);
    if (!template?.schema) {
      router.push('/');
      return;
    }
    dispatch(setSource(JSON.stringify(template.schema, null, 2)));
    dispatch(setStatus('ready'));
    router.push('/');
  };

  return (
    <DashboardLayout>
      <Seo
        title="Templates"
        description="Starter database schemas for SchemaForge — auth, e-commerce, blog, and more."
        noindex
      />
      <h1 className="text-xl font-bold text-[#c0c1ff] mb-1">Templates</h1>
      <p className="text-sm text-[#c7c4d7] mb-6">
        Pick a starter schema to load into the editor, then generate models, routes, and validators.
      </p>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {schemaTemplates.map((template) => (
          <div
            key={template.id}
            className="bg-[#131b2e] border border-[#171f33] rounded-lg p-5 flex flex-col"
          >
            <span className="text-[10px] uppercase tracking-widest text-[#7bd0ff] mb-2">
              {template.category}
            </span>
            <h3 className="text-sm font-semibold text-[#dae2fd] mb-1">{template.name}</h3>
            <p className="text-xs text-[#c7c4d7] flex-1">{template.description}</p>
            <button
              type="button"
              onClick={() => loadTemplate(template.id)}
              className="mt-4 px-3 py-2 rounded-md bg-[#c0c1ff] text-[#1000a9] text-sm font-semibold hover:bg-[#8083ff] transition-colors"
            >
              Load into editor
            </button>
          </div>
        ))}
      </div>

      <p className="mt-6 text-xs text-[#c7c4d7]">
        {templateCategories.length} categories available ·{' '}
        {getTemplatesByCategory('ecommerce').length} e-commerce template(s).
      </p>
    </DashboardLayout>
  );
};

export default TemplatesPage;