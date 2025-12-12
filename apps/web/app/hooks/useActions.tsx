import { BACKEND_URL } from "@repo/common/zod";
import axios from "axios";
import { useEffect, useState } from "react";
import { AvailabeAction } from "../types/workflow.types";

interface userActionsPrps {
  shouldFetch: boolean;
}
export const useActions = ({ shouldFetch }: userActionsPrps) => {
  const [actions, setActions] = useState<AvailabeAction[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!shouldFetch) return;
    const fetchData = async () => {
      try {
        setLoading(true);
        const Data = await axios.get(`${BACKEND_URL}/user/getAvailableNodes`, {
          withCredentials: true,
        });
        console.log(JSON.stringify(Data.data));
        setActions(Data.data);
        setLoading(false);
      } catch (e: any) {
        setError(e);
        console.log("Error while fetching Data from Triggers", e);
      }
    };
    fetchData();
  }, [shouldFetch]);

  return { actions, loading, error };
};
