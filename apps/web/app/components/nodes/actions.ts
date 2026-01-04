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

/**
 * Create a node or trigger from the provided Google Sheets configuration and return the backend result.
 *
 * Builds a config object from the supplied form data, calls the trigger creation path when `formData.type === 'trigger'`, or the node creation path otherwise, and returns the service response.
 *
 * @param formData - Form values containing type, credentialId, spreadsheetId, sheetName, operation, range, name, node_Trigger, workflowId, and optional position
 * @returns `{ success: boolean, data: any }` where `success` indicates operation outcome and `data` contains the created entity or backend payload
 */
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

/**
 * Updates an existing node or trigger configuration using the provided form data.
 *
 * @param formData - Payload containing `id`, `type` ('trigger' or other), and updated config fields: `credentialId`, `spreadsheetId`, `sheetName`, `operation`, and `range`
 * @returns An object with `success` indicating whether the update succeeded and `data` containing the updated resource payload
 */
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