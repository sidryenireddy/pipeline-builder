"use client";

import { usePipelineStore } from "@/hooks/use-pipeline-store";

export function DataPreview() {
  const previewNodeId = usePipelineStore((s) => s.previewNodeId);
  const previewLoading = usePipelineStore((s) => s.previewLoading);
  const previewData = usePipelineStore((s) => s.previewData);
  const setPreviewNodeId = usePipelineStore((s) => s.setPreviewNodeId);
  const nodes = usePipelineStore((s) => s.nodes);

  const node = nodes.find((n) => n.id === previewNodeId);
  const nodeName = node ? (node.data as any).label : "";

  return (
    <div className="flex flex-col border-t border-gray-200 bg-white" style={{ height: 280 }}>
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-gray-900">
            Data Preview
          </span>
          {nodeName && (
            <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
              {nodeName}
            </span>
          )}
          {previewData && (
            <span className="text-xs text-gray-400">
              {previewData.row_count} row{previewData.row_count !== 1 ? "s" : ""}
              {previewData.truncated ? " (showing first 50)" : ""}
            </span>
          )}
        </div>
        <button
          onClick={() => setPreviewNodeId(null)}
          className="text-gray-400 hover:text-gray-600 text-lg leading-none"
        >
          x
        </button>
      </div>

      <div className="flex-1 overflow-auto">
        {previewLoading && (
          <div className="flex h-full items-center justify-center">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Executing pipeline...
            </div>
          </div>
        )}

        {!previewLoading && previewData && previewData.columns.length > 0 && (
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-gray-50">
              <tr>
                {previewData.columns.map((col, i) => (
                  <th
                    key={col}
                    className="whitespace-nowrap border-b border-r border-gray-200 px-3 py-1.5 text-left text-xs font-medium text-gray-700"
                  >
                    <div>{col}</div>
                    <div className="font-normal text-gray-400">
                      {previewData.column_types?.[i] || ""}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {previewData.rows.map((row, ri) => (
                <tr key={ri} className="hover:bg-gray-50">
                  {previewData.columns.map((col) => (
                    <td
                      key={col}
                      className="whitespace-nowrap border-b border-r border-gray-100 px-3 py-1 text-xs text-gray-700"
                    >
                      {row[col] === null || row[col] === undefined ? (
                        <span className="text-gray-300">null</span>
                      ) : (
                        String(row[col])
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {!previewLoading && previewData && previewData.columns.length === 0 && (
          <div className="flex h-full items-center justify-center text-sm text-gray-400">
            No data. Check that input nodes have data configured.
          </div>
        )}

        {!previewLoading && !previewData && (
          <div className="flex h-full items-center justify-center text-sm text-gray-400">
            Click "Preview Data" on a transform to see results here.
          </div>
        )}
      </div>
    </div>
  );
}
