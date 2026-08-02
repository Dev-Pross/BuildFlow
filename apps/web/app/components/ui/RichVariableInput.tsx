"use client";
import React, { useRef, useEffect } from 'react';

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
}

const COLORS = [
    "bg-blue-500/20 text-blue-300 border-blue-500/50",
    "bg-green-500/20 text-green-300 border-green-500/50",
    "bg-purple-500/20 text-purple-300 border-purple-500/50",
    "bg-orange-500/20 text-orange-300 border-orange-500/50",
    "bg-pink-500/20 text-pink-300 border-pink-500/50",
    "bg-teal-500/20 text-teal-300 border-teal-500/50",
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

export function parseValueToHtml(rawValue: string, availableNodes: AvailableNode[]): string {
    if (!rawValue) return "";

    return rawValue.replace(/\{\{([^.]+)\.([^}]+)\}\}/g, (match, nodeId, path) => {
        const node = availableNodes.find(n => n.id === nodeId);
        const displayName = node ? node.name : "Unknown Node";
        const colorClass = getNodeColorClass(nodeId);

        return `<span contenteditable="false" class="inline-flex items-center px-1.5 py-0.5 mx-1 rounded text-[10px] border align-middle font-mono select-all cursor-default ${colorClass}" data-id="${nodeId}" data-path="${path}">${displayName} &gt; ${path}</span>`;
    });
}

export function RichVariableInput({ value, onChange, availableNodes, placeholder, onFocus }: RichVariableInputProps) {
    const editorRef = useRef<HTMLDivElement>(null);
    const isInternalUpdate = useRef(false);

    // Initial injection of HTML when the external value changes
    useEffect(() => {
        if (editorRef.current && !isInternalUpdate.current) {
            const newHtml = parseValueToHtml(value, availableNodes);
            if (editorRef.current.innerHTML !== newHtml) {
                editorRef.current.innerHTML = newHtml;
            }
        }
        isInternalUpdate.current = false;
    }, [value, availableNodes]);

    // Handle user input and serialize back to raw string
    const handleInput = () => {
        if (!editorRef.current) return;

        let rawString = "";

        // Iterate through the DOM children to reconstruct the string
        editorRef.current.childNodes.forEach((node) => {
            if (node.nodeType === Node.TEXT_NODE) {
                rawString += node.textContent || "";
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                const el = node as HTMLElement;
                if (el.classList.contains("pill")) {
                    const nodeId = el.getAttribute("data-id");
                    const path = el.getAttribute("data-path");
                    if (nodeId && path) {
                        rawString += `{{${nodeId}.${path}}}`;
                    }
                } else {
                    // For any pasted elements (br, divs), just extract text
                    rawString += el.textContent || "";
                }
            }
        });

        isInternalUpdate.current = true;
        onChange(rawString);
    };

    return (
        <div
            ref={editorRef}
            contentEditable={true}
            onInput={handleInput}
            onFocus={onFocus}
            data-placeholder={placeholder}
            className="w-full min-h-[40px] px-3 py-2 rounded-md border border-[#2a3525] bg-[#141a14] text-sm text-[#e8e8d8] focus:outline-none focus:border-[#baf266]/50 empty:before:content-[attr(data-placeholder)] empty:before:text-[#4a5440]"
        />
    );
}
