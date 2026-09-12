import api from "./axios";

// GET /api/kits
export const getKits = async () => {
  const response = await api.get("/kits");
  return response.data;
};

// GET /api/kits/:id
export const getKit = async (id) => {
  const response = await api.get(`/kits/${id}`);
  return response.data;
};

// POST /api/kits
export const createKit = async (data) => {
  const response = await api.post("/kits", data);
  return response.data;
};

// PATCH /api/kits/:id
export const updateKit = async (id, data) => {
  const response = await api.patch(`/kits/${id}`, data);
  return response.data;
};

// DELETE /api/kits/:id
export const deleteKit = async (id) => {
  const response = await api.delete(`/kits/${id}`);
  return response.data;
};

// POST /api/kits/:id/regenerate
export const regenerateKit = async (id) => {
  const response = await api.post(`/kits/${id}/regenerate`);
  return response.data;
};

// SSE progress stream
export const connectKitEvents = (id, onMessage) => {
  const base = import.meta.env.VITE_API_URL
  const es = new EventSource(`${base}/kits/${id}/events`, {
    withCredentials: true,
  });

  es.onmessage = (event) => {
    onMessage(JSON.parse(event.data));
  };

  es.onerror = () => es.close();

  return es;
};
