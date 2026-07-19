'use client';

import { useState, useMemo, useCallback } from 'react';
import { ChevronDown, Code, X } from 'lucide-react';
import { schemaTemplates, templateCategories, getTemplatesByCategory, type SchemaTemplate } from '@/data/templates';

interface TemplatesSelectorProps {
  onTemplateSelect: (template: SchemaTemplate) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TemplatesSelector({ onTemplateSelect, open, onOpenChange }: TemplatesSelectorProps) {
  const [activeCategory, setActiveCategory] = useState<SchemaTemplate['category'] | 'all'>('all');

  const filteredTemplates = useMemo(() => {
    if (activeCategory === 'all') {
      return schemaTemplates;
    }
    return getTemplatesByCategory(activeCategory);
  }, [activeCategory]);

  const handleSelect = useCallback((template: SchemaTemplate) => {
    onTemplateSelect(template);
    onOpenChange(false);
  }, [onTemplateSelect, onOpenChange]);

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => onOpenChange(!open)}
        className="inline-flex items-center gap-2 rounded-md border border-[#222a3d] bg-[#171f33] px-3 py-1.5 text-sm font-medium text-[#dae2fd] transition hover:border-[#c0c1ff] hover:text-[#c0c1ff]"
        aria-expanded={open}
      >
        <Code className="w-4 h-4" />
        Templates
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-80 rounded-lg border border-[#171f33] bg-[#131b2e] shadow-2xl">
          <div className="flex items-center justify-between border-b border-[#222a3d] p-3">
            <h3 className="text-sm font-semibold text-[#c0c1ff]">Load Template</h3>
            <button
              onClick={() => onOpenChange(false)}
              className="text-[#c7c4d7] transition hover:text-[#dae2fd]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-3">
            {/* Category Filter */}
            <div className="mb-3 flex flex-wrap gap-1">
              <button
                type="button"
                onClick={() => setActiveCategory('all')}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  activeCategory === 'all'
                    ? 'bg-[#c0c1ff] text-[#1000a9] font-semibold'
                    : 'text-[#c7c4d7] hover:bg-[#171f33]'
                }`}
              >
                All
              </button>
              {templateCategories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    activeCategory === cat
                      ? 'bg-[#c0c1ff] text-[#1000a9] font-semibold'
                      : 'text-[#c7c4d7] hover:bg-[#171f33]'
                  }`}
                >
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </button>
              ))}
            </div>

            {/* Templates List */}
            <div className="max-h-72 overflow-y-auto space-y-1">
              {filteredTemplates.length === 0 ? (
                <p className="px-2 py-3 text-xs text-[#c7c4d7]">No templates in this category.</p>
              ) : (
                filteredTemplates.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => handleSelect(template)}
                    className="w-full text-left rounded-md px-2 py-2 text-sm text-[#dae2fd] hover:bg-[#171f33] transition-colors"
                  >
                    <div className="font-medium">{template.name}</div>
                    <div className="text-xs text-[#c7c4d7] mt-0.5">{template.description}</div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}