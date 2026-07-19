import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import type { ParsedEntity } from '@/lib/parseSchema';

interface RelationshipLine {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  from: string;
  to: string;
}

type Props = {
  entities: ParsedEntity[];
};

export function SchemaVisualizer({ entities }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const fieldRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [lines, setLines] = useState<RelationshipLine[]>([]);

  const setCardRef = useCallback((key: string, node: HTMLDivElement | null) => {
    if (node) cardRefs.current.set(key, node);
    else cardRefs.current.delete(key);
  }, []);

  const setFieldRef = useCallback(
    (entityKey: string, fieldName: string, node: HTMLDivElement | null) => {
      const id = `${entityKey}.${fieldName}`;
      if (node) fieldRefs.current.set(id, node);
      else fieldRefs.current.delete(id);
    },
    [],
  );

  const computeLines = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const next: RelationshipLine[] = [];

    for (const entity of entities) {
      for (const field of entity.fields) {
        if (!field.ref) continue;
        const source = fieldRefs.current.get(`${entity.key}.${field.name}`);
        const target = cardRefs.current.get(field.ref);
        if (!source || !target) continue;

        const sRect = source.getBoundingClientRect();
        const tRect = target.getBoundingClientRect();

        next.push({
          id: `${entity.key}.${field.name}->${field.ref}`,
          x1: sRect.right - containerRect.left,
          y1: sRect.top + sRect.height / 2 - containerRect.top,
          x2: tRect.left - containerRect.left,
          y2: tRect.top + 28 - containerRect.top,
          from: entity.name,
          to: field.ref,
        });
      }
    }

    setLines(next);
  }, [entities]);

  useLayoutEffect(() => {
    computeLines();
    window.addEventListener('resize', computeLines);
    return () => window.removeEventListener('resize', computeLines);
  }, [computeLines]);

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Relationship overlay */}
      <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden>
        {lines.map((line) => {
          const midX = (line.x1 + line.x2) / 2;
          const path = `M ${line.x1} ${line.y1} C ${midX} ${line.y1}, ${midX} ${line.y2}, ${line.x2} ${line.y2}`;
          return (
            <g key={line.id}>
              <path d={path} fill="none" stroke="#7bd0ff" strokeWidth={1.5} strokeOpacity={0.7} />
              <circle cx={line.x2} cy={line.y2} r={3} fill="#7bd0ff" />
            </g>
          );
        })}
      </svg>

      {/* Entity cards */}
      <div className="relative flex flex-wrap gap-6">
        {entities.map((entity) => (
          <div
            key={entity.key}
            ref={(node) => setCardRef(entity.key, node)}
            className="w-72 bg-[#131b2e] border border-[#171f33] rounded-lg overflow-hidden shadow-lg"
          >
            <div className="bg-[#171f33] px-4 py-2.5 border-b border-[#222a3d]">
              <h3 className="text-sm font-semibold text-[#c0c1ff]">{entity.name}</h3>
              <p className="text-[10px] uppercase tracking-wider text-[#c7c4d7]">{entity.key}</p>
            </div>
            <div className="p-2">
              {entity.fields.length === 0 ? (
                <div className="px-2 py-2 text-xs text-[#c7c4d7] italic">No fields detected</div>
              ) : (
                entity.fields.map((field) => (
                  <div
                    key={field.name}
                    ref={(node) => setFieldRef(entity.key, field.name, node)}
                    className={`flex items-center justify-between px-2 py-1.5 rounded text-xs ${
                      field.ref ? 'bg-[#7bd0ff]/10' : ''
                    }`}
                  >
                    <span className="font-mono text-[#dae2fd]">{field.name}</span>
                    <span
                      className={`font-mono ${
                        field.ref ? 'text-[#7bd0ff]' : 'text-[#c7c4d7]'
                      }`}
                    >
                      {field.ref ? `→ ${field.ref}` : field.type}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
