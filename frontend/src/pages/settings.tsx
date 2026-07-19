import { useEffect } from 'react';
import type { NextPage } from 'next';
import { useDispatch, useSelector } from 'react-redux';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Seo } from '../components/Seo';
import {
  setNamingConvention,
  setOutputStructure,
  setApiPrefix,
  setAuthMiddleware,
  resetSettings,
  type NamingConvention,
  type OutputStructure,
  type SettingsState,
} from '../features/settings/settingsSlice';
import type { RootState } from '../store/store';

const STORAGE_KEY = 'schemaforge_settings';

function SegmentedControl<T extends string>({
  label,
  description,
  value,
  options,
  onChange,
}: {
  label: string;
  description: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div className="py-4 border-b border-[#171f33]">
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-[#dae2fd]">{label}</h3>
        <p className="text-xs text-[#c7c4d7] mt-0.5">{description}</p>
      </div>
      <div className="inline-flex rounded-md border border-[#222a3d] overflow-hidden">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`px-4 py-1.5 text-sm font-medium transition-colors ${
              value === option.value ? 'bg-[#c0c1ff] text-[#1000a9]' : 'bg-[#171f33] text-[#c7c4d7] hover:text-[#dae2fd]'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="py-4 border-b border-[#171f33] flex items-center justify-between gap-4">
      <div>
        <h3 className="text-sm font-semibold text-[#dae2fd]">{label}</h3>
        <p className="text-xs text-[#c7c4d7] mt-0.5">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${
          checked ? 'bg-[#c0c1ff]' : 'bg-[#222a3d]'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}

const SettingsPage: NextPage = () => {
  const dispatch = useDispatch();
  const settings = useSelector((state: RootState) => state.settings as SettingsState);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      /* ignore quota / privacy errors */
    }
  }, [settings]);

  return (
    <DashboardLayout>
      <Seo title="Settings" description="Configure SchemaForge code-generation preferences." noindex />
      <div className="max-w-2xl">
        <h1 className="text-xl font-bold text-[#c0c1ff] mb-1">Settings</h1>
        <p className="text-sm text-[#c7c4d7] mb-6">
          Preferences applied to future code generation.
        </p>

        <div className="bg-[#131b2e] border border-[#171f33] rounded-lg px-5">
          <SegmentedControl<NamingConvention>
            label="Naming Convention"
            description="How generated models and variables are named."
            value={settings.namingConvention}
            options={[
              { value: 'PascalCase', label: 'PascalCase' },
              { value: 'camelCase', label: 'camelCase' },
            ]}
            onChange={(value) => dispatch(setNamingConvention(value))}
          />

          <SegmentedControl<OutputStructure>
            label="Output File Structure"
            description="Flat files vs. a directory layout (models/, routes/, validators/)."
            value={settings.outputStructure}
            options={[
              { value: 'flat', label: 'Flat files' },
              { value: 'directory', label: 'Directory' },
            ]}
            onChange={(value) => dispatch(setOutputStructure(value))}
          />

          <div className="py-4 border-b border-[#171f33]">
            <h3 className="text-sm font-semibold text-[#dae2fd] mb-0.5">API Prefix</h3>
            <p className="text-xs text-[#c7c4d7] mb-3">
              Base path prepended to generated route mounts.
            </p>
            <input
              type="text"
              value={settings.apiPrefix}
              onChange={(e) => dispatch(setApiPrefix(e.target.value))}
              placeholder="/api"
              className="w-40 px-3 py-1.5 rounded-md bg-[#171f33] border border-[#222a3d] text-sm text-[#dae2fd] outline-none focus:border-[#c0c1ff]"
            />
          </div>

          <Toggle
            label="Auth Middleware"
            description="Inject authentication middleware into generated routes."
            checked={settings.authMiddleware}
            onChange={(checked) => dispatch(setAuthMiddleware(checked))}
          />
        </div>

        <button
          type="button"
          onClick={() => dispatch(resetSettings())}
          className="mt-6 px-4 py-2 rounded-md border border-[#464554] text-sm font-medium text-[#dae2fd] hover:border-[#ffb4ab] hover:text-[#ffb4ab] transition-colors"
        >
          Reset to defaults
        </button>
      </div>
    </DashboardLayout>
  );
};

export default SettingsPage;