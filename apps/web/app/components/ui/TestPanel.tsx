"use client";
import { useState, Fragment } from "react";
import { toast } from "sonner";
import { Copy, CheckCircle2, ChevronDown, ChevronRight, X } from "lucide-react";

interface TestPanelProps {
    testResult: any;
    metadata?: Record<string, any>;
    nodeName?: string;
    nodeIcon?: string;
    isLoading?: boolean;
}

export function TestPanel({ testResult, metadata, nodeName, nodeIcon, isLoading = false }: TestPanelProps) {
    const [expandedCells, setExpandedCells] = useState<Record<string, boolean>>({});
    const isHttpOrWebhook = Boolean(
        nodeName?.toLowerCase().includes("http") || 
        nodeName?.toLowerCase().includes("webhook")
    );
    const [viewMode, setViewMode] = useState<"table" | "json">(isHttpOrWebhook ? "json" : "table");
    const [httpSubView, setHttpSubView] = useState<"body" | "headers" | "full">("body");

    const toggleExpand = (cellKey: string) => {
        setExpandedCells(prev => ({ ...prev, [cellKey]: !prev[cellKey] }));
    };

    const renderObjectTable = (data: Record<string, any>) => {
        const entries = Object.entries(data);
        if (entries.length === 0) return <EmptyState message="Empty response" />;

        return (
            <div className="w-full border border-border dark:border-white/10 rounded-lg overflow-hidden bg-card dark:bg-black/20">
                <div className="flex bg-muted/50 dark:bg-chassis border-b border-border dark:border-white/10">
                    <div className="flex-[2] px-4 py-2.5 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground dark:text-chassis-foreground/70">Field</div>
                    <div className="flex-[3] px-4 py-2.5 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground dark:text-chassis-foreground/70 border-l border-border dark:border-white/10">Value</div>
                </div>
                {entries.map(([key, rawValue]) => {
                    let value = rawValue;
                    if (typeof rawValue === 'string' && (rawValue.trim().startsWith('{') || rawValue.trim().startsWith('['))) {
                        try { value = JSON.parse(rawValue); } catch (_) {}
                    }
                    const isNested = typeof value === 'object' && value !== null;
                    return (
                        <div key={key} className="flex border-b border-border/60 dark:border-white/10 last:border-b-0 hover:bg-muted/40 dark:hover:bg-white/5 transition-colors">
                            <div className="flex-[2] px-4 py-2.5 text-xs font-medium text-foreground dark:text-blue-300 font-mono truncate">
                                {key}
                            </div>
                            <div className={`flex-[3] min-w-0 text-xs text-foreground dark:text-chassis-foreground/80 border-l border-border/60 dark:border-white/10 font-mono break-all ${isNested && Array.isArray(value) && value.length > 0 && typeof value[0] === 'object' ? 'p-0' : 'px-4 py-2.5'}`}>
                                {isNested ? (
                                    Array.isArray(value) ? (
                                        value.length > 0 && typeof value[0] === 'object' ? (
                                            <div className=" w-full">{renderArrayOfObjectsTable(value, true)}</div>
                                        ) : (
                                            <span className="text-primary font-mono">[{value.map(v => typeof v === 'string' ? `"${v}"` : String(v)).join(', ')}]</span>
                                        )
                                    ) : (
                                        <div className="mt-2 mb-2 w-full">{renderObjectTable(value)}</div>
                                    )

                                ) : typeof value === 'boolean' ? (
                                    <span className={value ? 'text-emerald-500 font-semibold' : 'text-rose-500 font-semibold'}>{String(value)}</span>
                                ) : value === null || value === undefined ? (
                                    <span className="text-muted-foreground italic">null</span>
                                ) : (
                                    <span className="text-foreground dark:text-white font-mono">{String(value)}</span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    // Spreadsheet table for arrays of arrays (rows data)
    const renderSpreadsheetTable = (rows: any[][]) => {
        if (rows.length === 0) return <EmptyState message="No rows in response" />;
        const headers = rows[0] as string[];
        const dataRows = rows.slice(1);

        return (
            <div className="w-full border border-border dark:border-white/10 rounded-lg overflow-hidden overflow-x-auto">
                <table className="w-full text-left text-xs text-foreground dark:text-gray-300 min-w-max border-collapse">
                    <thead className="bg-muted/70 text-muted-foreground dark:bg-black/40 dark:text-chassis-foreground/80 sticky top-0">
                        <tr>
                            <th className="px-3 py-2.5 w-10 text-center border-r border-b border-border dark:border-white/10 text-muted-foreground font-mono text-[10px]">#</th>
                            {headers.map((h, i) => (
                                <th key={i} className="px-4 py-2.5 border-r border-b border-border dark:border-white/10 font-medium text-foreground dark:text-blue-300 truncate max-w-[160px] font-mono">
                                    {h || `Column ${i + 1}`}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {dataRows.map((row, ri) => (
                            <tr key={ri} className="border-b border-border/60 hover:bg-muted/40 dark:border-white/10 dark:hover:bg-white/5 transition-colors">
                                <td className="px-3 py-2 text-center border-r border-border/60 dark:border-white/10 text-muted-foreground bg-muted/20 dark:bg-black/20 font-mono text-[10px]">{ri + 1}</td>
                                {headers.map((_, ci) => (
                                    <td key={ci} className="px-4 py-2 border-r border-border/60 dark:border-white/10 truncate max-w-[200px] text-foreground dark:text-chassis-foreground/80 font-mono">
                                        {String(row[ci] ?? '')}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    // Array of objects table
    const renderArrayOfObjectsTable = (data: any[], isNestedTable = false) => {
        const normalizedData = (Array.isArray(data) ? data : []).map(item => {
            return (item && typeof item === 'object' && 'json' in item) ? item.json : item;
        });
        const keysSet = new Set<string>();
        normalizedData.slice(0, 100).forEach(item => {
            if (item && typeof item === 'object') Object.keys(item).forEach(k => keysSet.add(k));
        });
        const headers = Array.from(keysSet);

        if (headers.length === 0) {
            // Array of primitives or empty objects
            return (
                <div className="w-full border border-border dark:border-white/10 rounded-lg overflow-hidden">
                    {normalizedData.slice(0, 100).map((item, i) => (
                        <div key={i} className="flex border-b border-border/60 dark:border-white/10 last:border-b-0 hover:bg-muted/40 dark:hover:bg-white/5 transition-colors">
                            <div className="w-10 px-3 py-2 text-center border-r border-border/60 dark:border-white/10 text-muted-foreground bg-muted/20 dark:bg-black/20 text-[10px]">{i}</div>
                            <div className="flex-1 px-4 py-2 text-xs text-foreground/90 dark:text-gray-300 font-mono">
                                {typeof item === 'object' && item !== null ? JSON.stringify(item) : String(item ?? 'null')}
                            </div>
                        </div>
                    ))}
                </div>
            );
        }

        return (
            <div className={`w-full overflow-x-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent ${isNestedTable ? '' : 'border border-border dark:border-white/10 rounded-lg'}`}>
                <table className="w-full text-left text-xs text-foreground/90 dark:text-gray-300 min-w-max border-collapse">
                    <thead className="bg-muted/70 text-muted-foreground dark:bg-black/40 dark:text-chassis-foreground/80 sticky top-0">
                        <tr>
                            <th className="px-3 py-2.5 w-10 text-center border-r border-b border-border dark:border-white/10 text-muted-foreground font-normal text-[10px]">#</th>
                            {headers.map(h => (
                                <th key={h} className="px-4 py-2.5 border-r border-b border-border dark:border-white/10 font-medium text-primary dark:text-blue-300 whitespace-nowrap font-mono text-xs">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {normalizedData.slice(0, 100).map((item, ri) => (
                            <Fragment key={ri}>
                                <tr className="border-b border-border/60 dark:border-white/10 hover:bg-muted/40 dark:hover:bg-white/5 transition-colors">
                                    <td className="px-3 py-2 text-center border-r border-border/60 dark:border-white/10 text-muted-foreground bg-muted/20 dark:bg-black/20 text-[10px]">{ri}</td>
                                    {headers.map(h => {
                                        const rawVal = item?.[h];
                                        const cellKey = `${isNestedTable ? 'n_' : 'r_'}${ri}_${h}`;
                                        let val = rawVal;
                                        if (rawVal && typeof rawVal === 'object' && 'json' in rawVal) {
                                            val = rawVal.json;
                                        }
                                        if (typeof val === 'string' && (val.trim().startsWith('{') || val.trim().startsWith('['))) {
                                            try { val = JSON.parse(val); } catch (_) {}
                                        }

                                        const isArray = Array.isArray(val) && val.length > 0;
                                        const isObject = typeof val === 'object' && val !== null && !Array.isArray(val) && Object.keys(val).length > 0;
                                        const canExpand = isArray || isObject;

                                        if (canExpand) {
                                            const isExpanded = !!expandedCells[cellKey];
                                            return (
                                                <td key={h} className="px-4 py-2 border-r border-border/60 dark:border-white/10 text-foreground/90 dark:text-gray-300">
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleExpand(cellKey)}
                                                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono font-medium transition-all ${
                                                            isExpanded
                                                                ? 'bg-primary text-primary-foreground shadow-xs'
                                                                : 'bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20'
                                                        }`}
                                                    >
                                                        {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                                        <span>
                                                            {isArray
                                                                ? `${val.length} ${val.length === 1 ? 'item' : 'items'}`
                                                                : `${Object.keys(val).length} fields`}
                                                        </span>
                                                    </button>
                                                </td>
                                            );
                                        }

                                        const display = typeof val === 'object' && val !== null 
                                            ? JSON.stringify(val) 
                                            : String(val ?? '');
                                        return (
                                            <td 
                                                key={h} 
                                                className="px-4 py-2 border-r border-border/60 dark:border-white/10 whitespace-nowrap max-w-[400px] truncate text-foreground/90 dark:text-gray-300 font-mono text-xs"
                                                title={display}
                                            >
                                                {display}
                                            </td>
                                        );
                                    })}
                                </tr>

                                {/* Expandable Sub-table Row */}
                                {headers.map(h => {
                                    const rawVal = item?.[h];
                                    const cellKey = `${isNestedTable ? 'n_' : 'r_'}${ri}_${h}`;
                                    let val = rawVal;
                                    if (rawVal && typeof rawVal === 'object' && 'json' in rawVal) {
                                        val = rawVal.json;
                                    }
                                    if (typeof val === 'string' && (val.trim().startsWith('{') || val.trim().startsWith('['))) {
                                        try { val = JSON.parse(val); } catch (_) {}
                                    }
                                    const isArray = Array.isArray(val) && val.length > 0;
                                    const isObject = typeof val === 'object' && val !== null && !Array.isArray(val) && Object.keys(val).length > 0;
                                    const canExpand = isArray || isObject;
                                    if (!canExpand || !expandedCells[cellKey]) return null;

                                    return (
                                        <tr key={`${cellKey}_expanded`} className="bg-muted/30 dark:bg-black/40">
                                            <td colSpan={headers.length + 1} className="p-3 border-b border-border dark:border-white/10">
                                                <div className="rounded-lg border border-primary/20 dark:border-white/10 bg-card dark:bg-black/60 p-3 shadow-inner">
                                                    <div className="text-[11px] font-semibold text-primary mb-2.5 flex items-center justify-between">
                                                        <span className="flex items-center gap-2">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                                                            <span className="font-mono text-foreground dark:text-gray-200">{h}</span>
                                                            <span className="text-muted-foreground font-normal">
                                                                {isArray
                                                                    ? `(${val.length} ${val.length === 1 ? 'record' : 'records'})`
                                                                    : `(${Object.keys(val).length} fields)`}
                                                            </span>
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleExpand(cellKey)}
                                                            className="text-muted-foreground hover:text-foreground text-[11px] font-mono px-2 py-0.5 rounded hover:bg-muted dark:hover:bg-white/5 transition-colors border border-border dark:border-gray-700/50 inline-flex items-center gap-1"
                                                        >
                                                            <X className="w-3 h-3" />
                                                            Close
                                                        </button>
                                                    </div>
                                                    {isArray ? (
                                                        typeof val[0] === 'object' ? (
                                                            renderArrayOfObjectsTable(val, true)
                                                        ) : (
                                                            <pre className="text-xs text-emerald-600 dark:text-emerald-300 font-mono bg-muted/40 dark:bg-black/40 border border-border dark:border-white/10 p-2.5 rounded overflow-x-auto">
                                                                {JSON.stringify(val, null, 2)}
                                                            </pre>
                                                        )
                                                    ) : (
                                                        renderObjectTable(val)
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </Fragment>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    // Decide which renderer to use
    const renderResult = (data: any) => {
        if (data === null || data === undefined) return <EmptyState message="No test output available" />;

        // String result
        if (typeof data === 'string') {
            return (
                <div className="w-full border border-border dark:border-white/10 rounded-lg p-4 bg-muted/20 dark:bg-black/20">
                    <p className="text-sm text-foreground/90 dark:text-gray-300 font-mono whitespace-pre-wrap break-all">{data}</p>
                </div>
            );
        }

        // Spreadsheet pattern: { rows: [[headers], [row1], ...] }
        if (data.rows && Array.isArray(data.rows) && data.rows.length > 0 && Array.isArray(data.rows[0])) {
            return (
                <>
                    <div className="text-[10px] text-muted-foreground mb-2 flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full border border-emerald-500/20">Spreadsheet</span>
                        <span>{data.rows.length - 1} rows</span>
                    </div>
                    {renderSpreadsheetTable(data.rows)}
                </>
            );
        }

        // Direct 2D array
        if (Array.isArray(data) && data.length > 0 && Array.isArray(data[0])) {
            // Handle multiple wires / groups (e.g., from Data Filter)
            if (data.length > 1) {
                return (
                    <div className="flex flex-col gap-4">
                        {data.map((wire: any[], wireIndex: number) => {
                            const records = wire.map((item: any) => (item && typeof item === 'object' && 'json' in item) ? item.json : item);
                            const groupName = metadata?.group_names?.[wireIndex] || `Group ${wireIndex + 1}`;
                            return (
                                <div key={wireIndex} className="border border-border dark:border-white/10 rounded-lg overflow-hidden bg-card dark:bg-chassis">
                                    <div className="bg-muted/60 dark:bg-black/40 px-3 py-2 text-xs font-semibold text-foreground dark:text-gray-200 border-b border-border dark:border-white/10 flex justify-between items-center">
                                        <span>{groupName}</span>
                                        <span className="text-[10px] text-muted-foreground font-normal">{records.length} items</span>
                                    </div>
                                    {renderArrayOfObjectsTable(records)}
                                </div>
                            );
                        })}
                    </div>
                );
            }

            // Single wire fallback
            const records = data[0].map((item: any) => (item && typeof item === 'object' && 'json' in item) ? item.json : item);
            if (records.length === 1) {
                const singleRecord = records[0];
                const keys = singleRecord && typeof singleRecord === 'object' ? Object.keys(singleRecord) : [];
                const firstKey = keys[0];
                const isActionWrapper = Boolean(keys.length === 1 && firstKey && typeof singleRecord[firstKey] === 'object' && singleRecord[firstKey] !== null && !Array.isArray(singleRecord[firstKey]));

                let parsedBody = singleRecord?.body;
                if (typeof parsedBody === 'string' && (parsedBody.trim().startsWith('{') || parsedBody.trim().startsWith('['))) {
                    try { parsedBody = JSON.parse(parsedBody); } catch (_) {}
                }
                const isHttpOrWebhookResult = Boolean(
                    singleRecord && 
                    typeof singleRecord === 'object' && 
                    ('statusCode' in singleRecord || 'headers' in singleRecord) && 
                    'body' in singleRecord
                );

                if (isHttpOrWebhookResult) {
                    const isBodyArray = Array.isArray(parsedBody);
                    const isBodyObj = typeof parsedBody === 'object' && parsedBody !== null && !isBodyArray;
                    const isStatusSuccess = typeof singleRecord.statusCode === 'number' && singleRecord.statusCode >= 200 && singleRecord.statusCode < 300;

                    return (
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center justify-between flex-wrap gap-2 p-2.5 rounded-lg bg-muted/30 dark:bg-chassis border border-border dark:border-white/10">
                                <div className="flex items-center gap-2">
                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold border ${
                                        isStatusSuccess 
                                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' 
                                            : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                                    }`}>
                                        {singleRecord.statusCode} {singleRecord.statusText || (isStatusSuccess ? 'OK' : 'Response')}
                                    </span>
                                    <span className="text-xs text-muted-foreground font-mono">
                                        {isBodyArray ? `${parsedBody.length} records in body` : isBodyObj ? `${Object.keys(parsedBody).length} fields in body` : 'Response'}
                                    </span>
                                </div>

                                <div className="flex items-center p-0.5 bg-muted dark:bg-black/40 rounded-md border border-border dark:border-white/10">
                                    <button
                                        type="button"
                                        onClick={() => setHttpSubView("body")}
                                        className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                                            httpSubView === "body"
                                                ? "bg-primary text-primary-foreground shadow-xs"
                                                : "text-muted-foreground hover:text-foreground"
                                        }`}
                                    >
                                        Body {isBodyArray ? `(${parsedBody.length})` : ''}
                                    </button>
                                    {singleRecord.headers && (
                                        <button
                                            type="button"
                                            onClick={() => setHttpSubView("headers")}
                                            className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                                                httpSubView === "headers"
                                                    ? "bg-primary text-primary-foreground shadow-xs"
                                                    : "text-muted-foreground hover:text-foreground"
                                            }`}
                                        >
                                            Headers ({Object.keys(singleRecord.headers).length})
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => setHttpSubView("full")}
                                        className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                                            httpSubView === "full"
                                                ? "bg-primary text-primary-foreground shadow-xs"
                                                : "text-muted-foreground hover:text-foreground"
                                        }`}
                                    >
                                        Full Output
                                    </button>
                                </div>
                            </div>

                            {httpSubView === "body" ? (
                                isBodyArray ? (
                                    renderArrayOfObjectsTable(parsedBody)
                                ) : isBodyObj ? (
                                    renderObjectTable(parsedBody)
                                ) : (
                                    <div className="w-full border border-border dark:border-white/10 rounded-lg p-4 bg-muted/20 dark:bg-black/20">
                                        <pre className="text-xs text-emerald-600 dark:text-emerald-300 font-mono whitespace-pre-wrap">{String(parsedBody ?? '')}</pre>
                                    </div>
                                )
                            ) : httpSubView === "headers" ? (
                                renderObjectTable(singleRecord.headers || {})
                            ) : (
                                renderArrayOfObjectsTable(records)
                            )}
                        </div>
                    );
                }

                const displayData = (isActionWrapper && firstKey) ? singleRecord[firstKey] : singleRecord;

                if (isActionWrapper) {
                    return (
                        <>
                            <div className="text-[10px] text-muted-foreground mb-2 flex items-center gap-2">
                                <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full border border-primary/20">Result</span>
                                <span>1 item</span>
                            </div>
                            {renderObjectTable(displayData)}
                        </>
                    );
                } else {
                    return (
                        <>
                            <div className="text-[10px] text-muted-foreground mb-2 flex items-center gap-2">
                                <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full border border-primary/20">Table</span>
                                <span>1 row</span>
                            </div>
                            {renderArrayOfObjectsTable(records)}
                        </>
                    );
                }
            }
            return (
                <>
                    <div className="text-[10px] text-muted-foreground mb-2 flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full border border-emerald-500/20">Table</span>
                        <span>{records.length} rows</span>
                    </div>
                    {renderArrayOfObjectsTable(records)}
                </>
            );
        }

        // Array of objects
        if (Array.isArray(data) && data.length > 0) {
            return (
                <>
                    <div className="text-[10px] text-muted-foreground mb-2 flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full border border-primary/20">Array</span>
                        <span>{data.length} items</span>
                    </div>
                    {renderArrayOfObjectsTable(data)}
                </>
            );
        }

        // Plain object (Gmail output, generic results)
        if (typeof data === 'object') {
            // Check if there's a summary field (enriched outputs like Gmail)
            const hasSummary = data.summary && typeof data.summary === 'string';
            return (
                <>
                    {hasSummary && (
                        <div className="mb-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                            <span className="text-sm text-emerald-600 dark:text-emerald-300 font-medium">{data.summary}</span>
                        </div>
                    )}
                    {renderObjectTable(data)}
                </>
            );
        }

        // Fallback
        return (
            <div className="w-full border border-border dark:border-white/10 rounded-lg p-4 bg-muted/20 dark:bg-black/20">
                <pre className="text-xs text-muted-foreground dark:text-gray-400 font-mono whitespace-pre-wrap">{JSON.stringify(data, null, 2)}</pre>
            </div>
        );
    };

    return (
        <div className="w-full h-full bg-card text-card-foreground dark:bg-chassis dark:text-chassis-foreground flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-3.5 border-b border-border bg-card dark:border-white/10 dark:bg-chassis sticky top-0 z-20 flex-shrink-0">
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                        {nodeIcon && (
                            <img src={nodeIcon} className="w-8 h-8 rounded bg-white p-0.5 flex-shrink-0" alt="" />
                        )}
                        <h2 className="text-sm font-semibold text-foreground dark:text-chassis-foreground flex items-center gap-2 truncate">
                            {testResult !== null && testResult !== undefined ? (
                                <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            ) : (
                                <svg className="w-4 h-4 text-muted-foreground flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                </svg>
                            )}
                            <span className="truncate">{nodeName ? `${nodeName} Output` : 'Test Output'}</span>
                        </h2>
                    </div>

                    {testResult !== null && testResult !== undefined && (
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <div className="flex items-center p-0.5 bg-muted dark:bg-white/10 rounded-lg border border-border dark:border-white/10">
                                <button
                                    type="button"
                                    onClick={() => setViewMode("table")}
                                    className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                                        viewMode === "table"
                                            ? "bg-primary text-primary-foreground shadow-xs"
                                            : "text-muted-foreground hover:text-foreground"
                                    }`}
                                >
                                    Table
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setViewMode("json")}
                                    className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                                        viewMode === "json"
                                            ? "bg-primary text-primary-foreground shadow-xs"
                                            : "text-muted-foreground hover:text-foreground"
                                    }`}
                                >
                                    JSON
                                </button>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    navigator.clipboard.writeText(JSON.stringify(testResult, null, 2));
                                    toast.success("JSON copied to clipboard");
                                }}
                                className="px-2.5 py-1 text-xs font-medium text-foreground dark:text-gray-200 hover:bg-muted dark:hover:bg-white/10 bg-muted/50 dark:bg-white/5 border border-border dark:border-white/10 rounded-lg transition-colors flex items-center gap-1.5"
                                title="Copy raw JSON"
                            >
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copy</span>
                            </button>
                        </div>
                    )}
                </div>

                {isLoading ? (
                    <div className="mt-2 text-[10px] text-primary font-medium flex items-center gap-1.5 animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                        Executing on engine...
                    </div>
                ) : testResult !== null && testResult !== undefined ? (
                    <div className="mt-2 text-[10px] text-muted-foreground">
                        {typeof testResult === 'object' && !Array.isArray(testResult) && testResult.status === 'sent'
                            ? 'Email sent successfully'
                            : Array.isArray(testResult)
                                ? `${testResult.length} items returned`
                                : testResult?.rows
                                    ? `${testResult.rows.length - 1} rows returned`
                                    : 'Execution completed'
                        }
                    </div>
                ) : (
                    <div className="mt-2 text-[10px] text-muted-foreground">
                        Not tested yet
                    </div>
                )}
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
                {isLoading ? (
                    <TestingLoadingState nodeName={nodeName} />
                ) : testResult !== null && testResult !== undefined ? (
                    viewMode === "json" ? (
                        <div className="w-full h-full flex flex-col">
                            <div className="mb-2 flex items-center justify-between text-[11px] text-muted-foreground font-mono">
                                <span>Formatted JSON response</span>
                                <span>{JSON.stringify(testResult, null, 2).split('\n').length} lines</span>
                            </div>
                            <pre className="flex-1 w-full bg-muted/20 border border-border dark:bg-black/40 dark:border-white/10 text-emerald-600 dark:text-emerald-300 font-mono text-xs p-4 rounded-xl overflow-auto select-text leading-relaxed scrollbar-thin scrollbar-thumb-gray-700">
                                {JSON.stringify(testResult, null, 2)}
                            </pre>
                        </div>
                    ) : (
                        renderResult(testResult)
                    )
                ) : (
                    <NotTestedState nodeName={nodeName} />
                )}
            </div>
        </div>
    );
}

// Active loading state when node is executing on backend
function TestingLoadingState({ nodeName }: { nodeName?: string }) {
    return (
        <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center p-6">
            <div className="relative mb-5 flex items-center justify-center">
                <div className="w-20 h-20 rounded-full border-2 border-primary/20 animate-ping absolute" />
                <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center shadow-lg shadow-primary/5">
                    <span className="w-7 h-7 border-2 border-t-primary border-r-transparent border-b-primary/60 border-l-transparent rounded-full animate-spin" />
                </div>
            </div>
            <p className="text-sm text-foreground font-semibold mb-1">Executing Node...</p>
            <p className="text-xs text-primary font-medium max-w-[260px] leading-relaxed mb-2">
                Running {nodeName || 'node'} on execution engine
            </p>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-primary/10 text-primary border border-primary/20">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                Processing on cloud VM...
            </span>
        </div>
    );
}

// "Not Tested Yet" state — shown before any test is run
function NotTestedState({ nodeName }: { nodeName?: string }) {
    return (
        <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center">
            <div className="w-20 h-20 bg-muted/40 rounded-full flex items-center justify-center mb-5 border border-border dark:border-white/10">
                <svg className="w-10 h-10 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
            </div>
            <p className="text-sm text-muted-foreground font-medium mb-1">Not Tested Yet</p>
            <p className="text-xs text-muted-foreground/80 max-w-[200px] leading-relaxed">
                Click <span className="text-primary font-medium">Test Node</span> to execute {nodeName || 'this node'} and see the output here
            </p>
        </div>
    );
}

// Empty state for tested but empty response
function EmptyState({ message }: { message: string }) {
    return (
        <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center">
            <div className="w-16 h-16 bg-muted/40 rounded-full flex items-center justify-center mb-4 border border-border dark:border-white/10">
                <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
            </div>
            <p className="text-sm text-muted-foreground font-medium">{message}</p>
        </div>
    );
}

export default TestPanel;