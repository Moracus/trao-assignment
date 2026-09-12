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
export const regenerateKit = async (id, section = null) => {
  const response = await api.post(`/kits/${id}/regenerate`, section ? { section } : {});
  return response.data;
};

// Builder endpoints
export const updateQuestion = async (kitId, questionId, patch) => {
  const response = await api.patch(`/kits/${kitId}/builder/questions/${questionId}`, patch);
  return response.data;
};

export const createQuestion = async (kitId, payload) => {
  const response = await api.post(`/kits/${kitId}/builder/questions`, payload);
  return response.data;
};

export const deleteQuestion = async (kitId, questionId) => {
  const response = await api.delete(`/kits/${kitId}/builder/questions/${questionId}`);
  return response.data;
};

export const reorderQuestions = async (kitId, category, orderedIds) => {
  const response = await api.patch(`/kits/${kitId}/builder/questions/reorder`, { category, orderedIds });
  return response.data;
};

export const moveQuestion = async (kitId, questionId, category) => {
  const response = await api.patch(`/kits/${kitId}/builder/questions/${questionId}/move`, { category });
  return response.data;
};

export const updateFlashcard = async (kitId, flashcardId, patch) => {
  const response = await api.patch(`/kits/${kitId}/builder/flashcards/${flashcardId}`, patch);
  return response.data;
};

export const createFlashcard = async (kitId, payload) => {
  const response = await api.post(`/kits/${kitId}/builder/flashcards`, payload);
  return response.data;
};

export const deleteFlashcard = async (kitId, flashcardId) => {
  const response = await api.delete(`/kits/${kitId}/builder/flashcards/${flashcardId}`);
  return response.data;
};

export const updateCompanyBrief = async (kitId, patch) => {
  const response = await api.patch(`/kits/${kitId}/builder/company-brief`, patch);
  return response.data;
};

// SSE progress stream
export const connectKitEvents = (id, onMessage) => {
  const base = import.meta.env.VITE_API_URL;
  let retryCount = 0;

  const connect = () => {
    const es = new EventSource(`${base}/kits/${id}/events`, {
      withCredentials: true,
    });

    es.onmessage = (event) => {
      retryCount = 0;
      onMessage(JSON.parse(event.data));
    };

    es.onerror = () => {
      es.close();
      retryCount += 1;
      const delay = Math.min(1000 * retryCount, 5000);
      setTimeout(connect, delay);
    };

    return es;
  };

  return connect();
};
