import api from "./axios";

export const login = data => api.post("/auth/login", data);

export const signup = data => api.post("/auth/register", data);

export const me = () => api.get("/auth/me");

export const logout = () => api.post("/auth/logout");