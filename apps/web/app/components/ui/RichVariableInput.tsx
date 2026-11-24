"use client";
import React, { useRef, useEffect, useState } from 'react';

export interface AvailableNode {
    id: string;
    name: string;
}

interface RichVariableInputProps {
    value: string;
    onChange: (newValue: string) => void;
    availableNodes: AvailableNode[];
    placeholder?: string;
    onFocus?: () => void;
    onCaretChange?: (offset: number) => void;
}

const COLORS = [
    "bg-blue-500/10 text-blue-700 border-blue-500/30 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/50",
    "bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:bg-green-500/20 dark:text-green-300 dark:border-green-500/50",
    "bg-purple-500/10 text-purple-700 border-purple-500/30 dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-500/50",
    "bg-orange-500/10 text-orange-700 border-orange-500/30 dark:bg-orange-500/20 dark:text-orange-300 dark:border-orange-500/50",
    "bg-pink-500/10 text-pink-700 border-pink-500/30 dark:bg-pink-500/20 dark:text-pink-300 dark:border-pink-500/50",
    "bg-teal-500/10 text-teal-700 border-teal-500/30 dark:bg-teal-500/20 dark:text-teal-300 dark:border-teal-500/50",
];

export function getNodeColorClass(nodeId: string): string {
    if (!nodeId) return COLORS[0]!;
    let hash = 0;
    for (let i = 0; i < nodeId.length; i++) {
        hash = nodeId.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % COLORS.length;
    return COLORS[index]!;
}

export function parseValueToHtml(rawValue: any, availableNodes: AvailableNode[]): string {
    if (rawValue === null || rawValue === undefined) return "";
    const stringValue = typeof rawValue === 'string' ? rawValue : String(rawValue);
    if (!stringValue) return "";

    // 1. Sanitize the raw input to prevent Cross-Site Scripting (XSS)
    const escapeHtml = (str: string) => {
        return str
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    };
    const sanitizedValue = escapeHtml(stringValue).replace(/\n/g, "<br>");

    // 2. Parse the sanitized value to inject the visual pills
    return sanitizedValue.replace(/\{\{([^.]+)\.([^}]+)\}\}/g, (match, nodeId, path) => {
        const node = availableNodes.find(n => n.id === nodeId);
        const displayName = node ? escapeHtml(node.name) : "Unknown Node";
        const colorClass = getNodeColorClass(nodeId);
        return `<span contenteditable="false" class="pill inline-flex items-center px-1.5 py-0.5 mx-1 rounded text-[10px] border align-middle font-mono select-all cursor-default ${colorClass}" data-id="${nodeId}" data-path="${path}">${displayName} &gt; ${path}</span>`;
    });
}

export function RichVariableInput({ value, onChange, availableNodes, placeholder, onFocus, onCaretChange }: RichVariableInputProps) {
    const editorRef = useRef<HTMLDivElement>(null);
    const [isDragOver, setIsDragOver] = useState(false);

    const getEditorRawString = () => {
        if (!editorRef.current) return "";
        let rawString = "";

        const traverse = (node: Node) => {
            if (node.nodeType === Node.TEXT_NODE) {
                rawString += (node.textContent || "").replace(/\u00A0/g, " ");
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                const el = node as HTMLElement;
                if (el.nodeName === "BR") {
                    rawString += "\n";
                } else if (el.classList?.contains("pill")) {
                    const nodeId = el.getAttribute("data-id");
                    const path = el.getAttribute("data-path");
                    if (nodeId && path) {
                        rawString += `{{${nodeId}.${path}}}`;
                    }
                } else {
                    if (el.nodeName === "DIV" && rawString.length > 0 && !rawString.endsWith("\n")) {
                        rawString += "\n";
                    }
                    el.childNodes.forEach(traverse);
                }
            }
        };

        editorRef.current.childNodes.forEach(traverse);
        return rawString;
    };

    // Computes the exact cursor offset in the serialized string
    const getCaretOffset = (): number => {
        if (!editorRef.current) return 0;
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0) return getEditorRawString().length;

        const range = sel.getRangeAt(0);
        if (!editorRef.current.contains(range.startContainer)) return getEditorRawString().length;

        let offset = 0;
        let found = false;

        const traverse = (node: Node) => {
            if (found) return;

            if (node === range.startContainer) {
                if (node.nodeType === Node.TEXT_NODE) {
                    const textBefore = (node.textContent || "").substring(0, range.startOffset).replace(/\u00A0/g, " ");
                    offset += textBefore.length;
                }
                found = true;
                return;
            }

            if (node.nodeType === Node.TEXT_NODE) {
                offset += (node.textContent || "").replace(/\u00A0/g, " ").length;
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                const el = node as HTMLElement;
                if (el.nodeName === "BR") {
                    offset += 1;
                } else if (el.classList?.contains("pill")) {
                    const nodeId = el.getAttribute("data-id");
                    const path = el.getAttribute("data-path");
                    if (nodeId && path) {
                        offset += `{{${nodeId}.${path}}}`.length;
                    }
                } else {
                    if (el.nodeName === "DIV" && offset > 0) {
                        offset += 1;
                    }
                    for (let i = 0; i < el.childNodes.length; i++) {
                        traverse(el.childNodes[i]!);
                        if (found) return;
                    }
                }
            }
        };

        for (let i = 0; i < editorRef.current.childNodes.length; i++) {
            traverse(editorRef.current.childNodes[i]!);
            if (found) break;
        }

        return offset;
    };

    const notifyCaret = () => {
        if (onCaretChange) {
            const offset = getCaretOffset();
            onCaretChange(offset);
        }
    };

    // Initial injection of HTML when the external value changes
    useEffect(() => {
        if (editorRef.current) {
            const currentRaw = getEditorRawString();
            if (currentRaw !== value) {
                const newHtml = parseValueToHtml(value, availableNodes);
                if (editorRef.current.innerHTML !== newHtml) {
                    editorRef.current.innerHTML = newHtml;
                }
            }
        }
    }, [value, availableNodes]);

    // Handle user typing
    const handleInput = () => {
        const rawString = getEditorRawString();
        onChange(rawString);
        notifyCaret();
    };

    // Native HTML5 Drag and Drop handlers
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        if (
            e.dataTransfer.types.includes('text/plain') ||
            e.dataTransfer.types.includes('application/buildflow-variable')
        ) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
            if (!isDragOver) setIsDragOver(true);
        }
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setIsDragOver(false);
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragOver(false);

        const text = e.dataTransfer.getData('text/plain');
        if (!text) return;

        // Find caret position at drop coordinates
        let range: Range | null = null;
        if (typeof document !== 'undefined') {
            if (document.caretRangeFromPoint) {
                range = document.caretRangeFromPoint(e.clientX, e.clientY);
            } else if ((document as any).caretPositionFromPoint) {
                const pos = (document as any).caretPositionFromPoint(e.clientX, e.clientY);
                if (pos && pos.offsetNode) {
                    range = document.createRange();
                    range.setStart(pos.offsetNode, pos.offset);
                    range.collapse(true);
                }
            }
        }

        if (range && editorRef.current && editorRef.current.contains(range.startContainer)) {
            const sel = window.getSelection();
            if (sel) {
                sel.removeAllRanges();
                sel.addRange(range);
            }

            const pillHtml = parseValueToHtml(text, availableNodes);
            const temp = document.createElement('div');
            temp.innerHTML = pillHtml;

            range.deleteContents();
            const frag = document.createDocumentFragment();
            let child: ChildNode | null;
            while ((child = temp.firstChild)) {
                frag.appendChild(child);
            }
            frag.appendChild(document.createTextNode(' '));
            range.insertNode(frag);
            range.collapse(false);

            const newRaw = getEditorRawString();
            onChange(newRaw);
            notifyCaret();
        } else {
            const currentRaw = getEditorRawString();
            const newRaw = currentRaw ? `${currentRaw} ${text}` : text;
            onChange(newRaw);
            notifyCaret();
        }
    };

    return (
        <div
            ref={editorRef}
            contentEditable={true}
            onInput={handleInput}
            onKeyUp={notifyCaret}
            onMouseUp={notifyCaret}
            onBlur={notifyCaret}
            onFocus={() => {
                onFocus?.();
                notifyCaret();
            }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            data-placeholder={placeholder}
            className={`w-full min-h-[40px] px-3 py-2 rounded-xl border text-sm transition-all focus:outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground whitespace-pre-wrap ${
                isDragOver
                    ? "border-primary ring-2 ring-primary/20 bg-primary/10 text-foreground dark:text-white"
                    : "border-border bg-card text-card-foreground dark:border-white/10 dark:bg-chassis dark:text-chassis-foreground focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
            }`}
        />
    );
}
