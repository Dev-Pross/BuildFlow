"use client"
import { useEffect, useRef, useState, useCallback } from "react";
import { useAppDispatch, useAppSelector } from "./redux";
import { api } from "../lib/api";
import { store } from "@/store";
import { workflowActions } from "@/store/slices/workflowSlice";
import { toast } from "sonner";

type Status = "saved" | "error" | "saving"

export function useAutoSave(workflowId: string) {
    const [saveStatus, setSaveStatus] = useState<Status>("saved")
    const dispatch = useAppDispatch()
    const isChangedState = useAppSelector(s => s.workflow.isChanged)
    const lastChanged = useAppSelector(s => s.workflow.lastChanged)
    const hasChanges = isChangedState.trigger || isChangedState.edges || isChangedState.nodes;

    const isSavingRef = useRef(false);

    const displayStatus = saveStatus === 'saving' ? 'Saving...' :
        saveStatus === 'error' ? 'Save Error' :
            hasChanges ? 'Unsaved Changes' : 'Saved'

    const batchSave = useCallback(async () => {
        const { data, isChanged, changedNodeIds, deletedNodeIds, deletedTriggerId, newNodeIds } = store.getState().workflow

        const anyChanges = isChanged.edges || isChanged.nodes || isChanged.trigger;

        if (!anyChanges || !data.workflowId || isSavingRef.current) return;

        isSavingRef.current = true;
        setSaveStatus("saving")

        try {
            const payload: any = {
                workflowId: workflowId
            };
            if (deletedNodeIds && deletedNodeIds.length > 0) payload.deletedNodeIds = deletedNodeIds;
            if (deletedTriggerId) payload.deletedTriggerId = deletedTriggerId;

            if (newNodeIds && newNodeIds.length > 0 && data.nodes) {
                payload.newNodes = data.nodes
                    .filter(n => newNodeIds.includes(n.NodeId))
                    .map(node => ({ ...node, workflowId }))
            }

            if (isChanged.nodes && data.nodes && changedNodeIds && changedNodeIds.length > 0) {
                payload.changedNodes = data.nodes
                    .filter(n => changedNodeIds.includes(n.NodeId) && !(newNodeIds && newNodeIds.includes(n.NodeId)))
                    .map(node => ({
                        NodeId: node.NodeId,
                        Config: node.Config,
                        position: node.position
                    }));
            }
            if (isChanged.trigger && data.trigger) {
                payload.trigger = {
                    TriggerId: data.trigger.TriggerId,
                    Config: data.trigger.Config,
                    position: data.trigger.position,
                };
            }
            if (isChanged.edges) {
                payload.edges = data.edges;
            }

            await api.workflows.sync(payload);

            setSaveStatus("saved")
            dispatch(workflowActions.markSynced())
            dispatch(workflowActions.clearTracker());

        } catch (e: any) {
            setSaveStatus("error")
            const errorMessage = e?.response?.data?.message || e?.response?.data?.error || e?.message || "Failed to auto-save workflow";
            console.error("error while auto saving: ", errorMessage);
            toast.error(`Auto-save error: ${errorMessage}`);
        } finally {
            isSavingRef.current = false;
        }
    }, [workflowId, dispatch]);

    // Keep batchSave ref fresh for unmount and event listeners
    const batchSaveRef = useRef(batchSave);
    useEffect(() => {
        batchSaveRef.current = batchSave;
    }, [batchSave]);

    // 1. Reactive Debounced Auto-Save (4 seconds after user stops editing)
    useEffect(() => {
        if (!hasChanges) return;

        const debounceTimer = setTimeout(() => {
            batchSaveRef.current();
        }, 4000);

        return () => clearTimeout(debounceTimer);
    }, [hasChanges, lastChanged]);

    // 2. Lifecycle listeners: beforeunload & unmount cleanup
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            const { isChanged } = store.getState().workflow
            if (isChanged.edges || isChanged.nodes || isChanged.trigger) {
                e.preventDefault()
                batchSaveRef.current();
                e.returnValue = true;
                return true
            }
        }

        window.addEventListener("beforeunload", handleBeforeUnload)

        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload)
            const { isChanged } = store.getState().workflow
            if (isChanged.edges || isChanged.nodes || isChanged.trigger) {
                batchSaveRef.current()
            }
        }
    }, [workflowId])

    return { saveStatus, batchSave, displayStatus }
}   