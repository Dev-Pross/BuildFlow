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
