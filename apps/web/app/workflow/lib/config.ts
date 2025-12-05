import { BACKEND_URL } from "@repo/common/zod";
import axios from "axios";
import { any, config } from "zod/v4";
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
