"use client"
import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "./redux";
import { api } from "../lib/api";
import { store } from "@/store";
import { workflowActions } from "@/store/slices/workflowSlice";

type Status = "saved" | "error" | "saving"
export function useAutoSave(workflowId: string){
    const [saveStatus, setSaveStatus] = useState<Status>("saved")
    const dispatch = useAppDispatch()
    const isChangedState = useAppSelector(s=> s.workflow.isChanged)
    const hasUnChanged = isChangedState.trigger || isChangedState.edges || isChangedState.nodes;

    const displayStatus = saveStatus === 'saving' ? 'Saving...' :
                            saveStatus === 'error' ? 'Save Error' :
                            hasUnChanged ? 'Unsaved Changes' : 'Saved'

    const batchSave = async()=>{
        const { data, isChanged, changedNodeIds } = store.getState().workflow

        const anyChanges = isChanged.edges || isChanged.nodes || isChanged.trigger;

        if(!anyChanges || !data.workflowId) return;
        
        setSaveStatus("saving")

        try{
            if(isChanged.nodes && data.nodes){
                const changedNodes = data.nodes.filter(n => changedNodeIds.includes(n.NodeId))
                await Promise.all(
                    changedNodes.map(node => api.nodes.update({
                        NodeId: node.NodeId,
                        Config: node.Config,
                        position: node.position
                    }))
                )
            }
            if(isChanged.trigger){
                const trigger = data.trigger;
                if(trigger)
                    await api.triggers.update({
                    TriggerId: trigger.TriggerId,
                    Config: trigger.Config,
                    Position: trigger.position    
                    })
            }
            if(isChanged.edges){
                const edges = data.edges;
                if(edges)
                    await api.workflows.put({workflowId: workflowId,edges})
            }
            setSaveStatus("saved")
            dispatch(workflowActions.markSynced())
        }catch(e){
            setSaveStatus("error")
            console.error("error while auto saving: ", e instanceof Error ? e.message : "")
        }
    }

    useEffect(()=>{
        const interval = setInterval(batchSave,30000);

        const handleBeforeUnload = (e: BeforeUnloadEvent) =>{
            const { isChanged } = store.getState().workflow
            if(isChanged.edges || isChanged.nodes || isChanged.trigger){
                e.preventDefault()
                batchSave();
            }
        }

        window.addEventListener("beforeunload", handleBeforeUnload)

        return ()=>{
            clearInterval(interval);
            window.removeEventListener("beforeunload", handleBeforeUnload)
            batchSave()
        }
    }, [workflowId])

    return { saveStatus, batchSave, displayStatus}

}   