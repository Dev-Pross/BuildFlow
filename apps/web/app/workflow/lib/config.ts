import { BACKEND_URL } from "@repo/common/zod";
import { GoogleSheetsNodeExecutor } from "@repo/nodes";
import axios from "axios"
export const getAvailableTriggers = async () => {
  try {
    const response = await axios.get(
      `${BACKEND_URL}/user/getAvailableTriggers`,
      {
        withCredentials: true,
      }
    );
    console.log(response.data.Data);
    console.log(response.data);
 
    const Data = JSON.stringify(response.data.Data);
    console.log(Data);
    console.log("This is the name from the", response.data.Data);
    console.log("This is the config from the", response.data.Data);

    return response.data;
  } catch (error) {
    console.error("Error fetching available triggers:", error);
    throw error;
  }
};

export const getCredentials = async(type: string)=>{
  try{
   
    const response = await axios.get(
      `${BACKEND_URL}/user/getCredentials/${type}`,
      {
        withCredentials: true,
      }
    );
    console.log("response from config: ",response);
    
    const Data = JSON.stringify(response.data.Data);
    return response.data.Data;
  }
  catch(e){
    console.error("Error fetching credentials:", e);
    throw e;
  }
}

const date = new Date()


export const createWorkflow = async(userId: string)=>{
    try{
      const response = await axios.post(`${BACKEND_URL}/user/create/workflow`,
        {
          Name:`workflow-${date.getTime()}`,
          UserId: userId,
          Config: {}
        },{
          headers: {
              'Content-Type': 'application/json'
            },
            withCredentials: true
        }
      )

      const workflow = response.data
      console.log('new workflow: ',workflow)
      return workflow.Data
    }catch(e){
      console.error("Error in creating workflow:", e);
      throw e;
    }
}

interface Triggercontext{
    // userId: formData.userId,
    name: string,
    workflowId: string,
    node_Trigger: string,
    config: {
      credId: string,
      operation: string,
      spreadsheetId: string,
      range: string,
      sheetName: string,
    },
  };
export const  createTrigger = async(context: Triggercontext)=>{
  try{
    console.log('Trigger context: ', context)
    const response = await axios.post(`${BACKEND_URL}/user/create/trigger`,
      {
        Name: context.name,
        AvailableTriggerID: context.node_Trigger,
        Config: context.config,
        WorkflowId: context.workflowId,
        TriggerType:""
      },
      {
      headers: {"Content-Type": "application/json"},
      withCredentials:true
      })

    const trigger = (response.data)
    console.log('trigger created: ', trigger);
    return { 
      success: true,
      data: trigger
    }
  }catch(e){
    console.error("Error in creating Trigger:", e);
    return {
      success: false,
      data: e instanceof Error ? e.message : `unknown error ${e}` 
    }
  }
}

interface Nodecontext{
    // userId: formData.userId,
    name: string,
    workflowId: string,
    node_Trigger: string,
    position? :number,
    config: {
      credId: string,
      operation: string,
      spreadsheetId: string,
      range: string,
      sheetName: string,
    },
  };
export const  createNode = async(context: Nodecontext)=>{
  try{
      console.log('Node context: ', context)

    const response = await axios.post(`${BACKEND_URL}/user/create/node`,{
      
        Name: context.name,
        AvailableNodeId: context.node_Trigger,
        WorkflowId: context.workflowId,
        Config: context.config,
        Position: context.position ? context.position : 0
    },{
      headers: {"Content-Type": "application/json"},
      withCredentials:true
    })

    const node = (response.data)
    console.log('Node created: ', node);
    return {
      success: true,
      data: node
    }
    
  }catch(e){
    console.error("Error in creating Node:", e);
    return {success: false,
      data: e instanceof Error ? e.message : `unknown error ${e}` 
    };
  }
}

export const getEmptyWorkflow = async()=>{
  try{
    const res = await axios.get(`${BACKEND_URL}/user/empty/workflow`,{
      withCredentials: true
    })
    
    const workflow = res.data.Data
    return workflow
  }
  catch(e){
    console.error("Error in fetching workflows:", e);
    throw e;
  }
}

export const getworkflowData = async(workflowId: string)=>{
  try{
    const res = await axios.get(`${BACKEND_URL}/user/workflow/${workflowId}`,{
      withCredentials: true
    })
    console.log('workflow data includes trigger and nodes: ', res.data.Data )
    return {
      success: true,
      data: res.data.Data
    }
  }catch(e){
    console.error("Error in creating Node:", e);
    return {success: false,
      data: e instanceof Error ? e.message : `unknown error ${e}` 
    };
  }
}