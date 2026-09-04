'use client';

import { useState } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';

interface JsonTreeViewerProps {
  data: any;
}

function JsonNode({ name, value, depth = 0 }: { name?: string; value: any; depth?: number }) {
  const [expanded, setExpanded] = useState(depth < 2);

  if (value === null) {
    return (
      <div className="flex items-center gap-1" style={{ paddingLeft: `${depth * 16}px` }}>
        {name && <span className="text-blue-400">"{name}"</span>}
        {name && <span className="text-muted-foreground">: </span>}
        <span className="text-gray-500">null</span>
      </div>
    );
  }

  if (typeof value === 'object' && value !== null) {
    const isArray = Array.isArray(value);
    const entries: [string, any][] = isArray ? value.map((v: any, i: number) => [String(i), v] as [string, any]) : Object.entries(value);
    const bracket = isArray ? ['[', ']'] : ['{', '}'];

    return (
      <div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 hover:bg-muted/50 rounded px-1 w-full text-left"
          style={{ paddingLeft: `${depth * 16}px` }}
        >
          {expanded ? (
            <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
          ) : (
            <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
          )}
          {name && <span className="text-blue-400">"{name}"</span>}
          {name && <span className="text-muted-foreground">: </span>}
          <span className="text-muted-foreground">
            {bracket[0]}
            {!expanded && `... ${entries.length} items ${bracket[1]}`}
          </span>
        </button>
        {expanded && (
          <>
            {entries.map(([key, val], i) => (
              <JsonNode key={`${key}-${i}`} name={key} value={val} depth={depth + 1} />
            ))}
            <div style={{ paddingLeft: `${depth * 16}px` }} className="text-muted-foreground">
              {bracket[1]}
            </div>
          </>
        )}
      </div>
    );
  }

  const color = typeof value === 'string' ? 'text-green-400' : typeof value === 'number' ? 'text-yellow-400' : 'text-purple-400';

  return (
    <div className="flex items-center gap-1" style={{ paddingLeft: `${depth * 16}px` }}>
      <span className="w-3" />
      {name && <span className="text-blue-400">"{name}"</span>}
      {name && <span className="text-muted-foreground">: </span>}
      <span className={color}>
        {typeof value === 'string' ? `"${value.length > 200 ? value.slice(0, 200) + '...' : value}"` : String(value)}
      </span>
    </div>
  );
}

export function JsonTreeViewer({ data }: JsonTreeViewerProps) {
  return (
    <div className="rounded-lg bg-muted/50 p-4 font-mono text-xs overflow-auto max-h-[600px]">
      <JsonNode value={data} />
    </div>
  );
}
