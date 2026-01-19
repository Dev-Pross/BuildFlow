// lib/api.ts
import axios from "axios";
import { BACKEND_URL, NodeUpdateSchema } from "@repo/common/zod";
import { TriggerUpdateSchema } from "@repo/common/zod";
import z from "zod";
import { getCredentials } from "../workflow/lib/config";
// Wrap all API calls in async functions and make sure to set withCredentials: true and add Content-Type header.
export const api = {
  workflows: {
    create: async (name: string, Config: any) =>
      await axios.post(
        `${BACKEND_URL}/user/create/workflow`,
        { Name: name, Config: Config },
        {
          withCredentials: true,
          headers: { "Content-Type": "application/json" },
        }
      ),
    get: async (id: string) => {
      return await axios.get(`${BACKEND_URL}/user/workflow/${id}`, {
        withCredentials: true,
        headers: { "Content-Type": "application/json" },
      });
    },
    put: async (data: any) => {
      return await axios.put(`${BACKEND_URL}/user/workflow/update`,
        data,
        {
          withCredentials: true,
          headers: { "Content-Type": "application/json" },
        })
    }
  },
  triggers: {
    getAvailable: async () =>
      await axios.get(`${BACKEND_URL}/user/getAvailableTriggers`, {
        withCredentials: true,
        headers: { "Content-Type": "application/json" },
      }),
    create: async (data: any) =>
      await axios.post(`${BACKEND_URL}/user/create/trigger`, data, {
        withCredentials: true,
        headers: { "Content-Type": "application/json" },
      }),
    update: async (data: z.infer<typeof TriggerUpdateSchema>) => {
      return await axios.put(`${BACKEND_URL}/user/update/trigger`, data, {
        withCredentials: true,
        headers: { "Content-Type": "application/json" },
      });
    },
  },
  nodes: {
    getAvailable: async () =>
      await axios.get(`${BACKEND_URL}/user/getAvailableNodes`, {
        withCredentials: true,
        headers: { "Content-Type": "application/json" },
      }),
    create: async (data: any) =>
      await axios.post(`${BACKEND_URL}/user/create/node`, data, {
        withCredentials: true,
        headers: { "Content-Type": "application/json" },
      }),
    update: async (data: z.infer<typeof NodeUpdateSchema>) =>
      await axios.put(`${BACKEND_URL}/user/update/node`, data, {
        withCredentials: true,
        headers: { "Content-Type": "application/json" },
      }),
  },
  Credentials: {
    getCredentials: async (type: string) => {
      const res = await axios.get(`${BACKEND_URL}/user/getCredentials/${type}`, {
        withCredentials: true,
        headers: { "Content-Type": "application/json" },
      });
      return res.data.Data;
    },

    getAllCreds: async () =>
      await axios.get(`${BACKEND_URL}/user/getAllCreds`, {
        withCredentials: true,
        headers: { "Content-Type": "application/json" },
      }),
  },
};
