
import { createNode, createTrigger, updateNode, updateTrigger } from '@/app/workflow/lib/config';

interface SaveConfigFormData {
  // userId: string;
  type: string
  credentialId: string;
  spreadsheetId: string;
  sheetName: string;
  operation: string;
  range: string;
  position?: number;
  name: string;
  node_Trigger: string;
  workflowId: string;

}

interface updateConfigData{
  type: string
  credentialId: string;
  spreadsheetId: string;
  sheetName: string;
  operation: string;
  range: string;
  id: string
}

export async function handleSaveConfig(formData: SaveConfigFormData) {
  // const executor = new GoogleSheetsNodeExecutor();
  const context = {
    // userId: formData.userId,
    name: formData.name,
    workflowId: formData.workflowId,
    node_Trigger: formData.node_Trigger,
    config: {
      credId: formData.credentialId,
      operation: formData.operation,
      spreadsheetId: formData.spreadsheetId,
      range: formData.range,
      sheetName: formData.sheetName,
    },
  };
  if(formData.type === 'trigger')
  {
    const trigger = await createTrigger(context)
    console.log('triggger created using config backend: ',trigger)
    
      return{
        success: trigger.success,
        data: trigger.data
      }
  }
  else{
    const node = await createNode({...context, position: formData.position ? formData.position : 0})
    console.log('NOde created using config backend: ',node);
    return {
      success:node.success,
      data: node.data 
    }
  }
    

  // const result = await executor.execute(context);
  
  // // Return plain object (not class instance)
  // return {
  //   success: result.success,
  //   output: result.output || null,
  //   error: result.error || null,
  //   authUrl: result.authUrl || null,
  //   requiresAuth: result.requiresAuth || false,
  // };
}

export async function handleUpdateConfig(formData: updateConfigData){
  const data = {
    id: formData.id,
    config: {
      credId: formData.credentialId,
      spreadsheetId: formData.spreadsheetId,
      sheetName: formData.sheetName,
      operation: formData.operation,
      range: formData.range
    }
  }
  if(formData.type === 'trigger')
  {
    const trigger = await updateTrigger(data)
    console.log('triggger updated using config backend: ',trigger)
    
      return{
        success: trigger.success,
        data: trigger.data
      }
  }
  else{
    const node = await updateNode(data)
    console.log('NOde updated using config backend: ',node);
    return {
      success:node.success,
      data: node.data 
    }
  }

}