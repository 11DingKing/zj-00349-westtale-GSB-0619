import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  timeout: 10000,
});

api.interceptors.request.use(
  (config) => {
    const visitorId = localStorage.getItem("visitorId");
    if (visitorId) {
      config.headers["X-Visitor-Id"] = visitorId;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => {
    if (response.data && response.data.code === 0) {
      return response.data.data;
    }
    return Promise.reject(new Error(response.data?.message || "请求失败"));
  },
  (error) => {
    const message =
      error.response?.data?.message || error.message || "网络错误";
    return Promise.reject(new Error(message));
  },
);

export const publicApi = {
  getStorylines: () => api.get("/storylines"),
  getStoryline: (id) => api.get(`/storylines/${id}`),
  getStorylineChapters: (id) => api.get(`/storylines/${id}/chapters`),
  getChapter: (id) => api.get(`/chapters/${id}`),

  getArtifacts: (params) => api.get("/artifacts", { params }),
  getArtifact: (id) => api.get(`/artifacts/${id}`),
  getArtifactCategories: () => api.get("/categories/artifacts"),

  getFigures: (params) => api.get("/figures", { params }),
  getFigure: (id) => api.get(`/figures/${id}`),
  getFigureStoryline: (id) => api.get(`/figures/${id}/storyline`),

  getComments: (chapterId, params) =>
    api.get(`/chapters/${chapterId}/comments`, { params }),
  addComment: (chapterId, data) =>
    api.post(`/chapters/${chapterId}/comments`, data),
  likeComment: (commentId) => api.post(`/comments/${commentId}/like`),

  getFlowers: (chapterId, params) =>
    api.get(`/chapters/${chapterId}/flowers`, { params }),
  sendFlower: (chapterId, data) =>
    api.post(`/chapters/${chapterId}/flowers`, data),

  getProgress: (visitorId) => api.get("/progress", { params: { visitorId } }),
  saveProgress: (data) => api.post("/progress", data),
  markWatched: (chapterId, visitorId) =>
    api.post(`/chapters/${chapterId}/mark-watched`, { visitorId }),
};

export const adminApi = {
  getStats: () => api.get("/admin/stats"),

  getStorylines: () => api.get("/admin/storylines"),
  createStoryline: (data) => api.post("/admin/storylines", data),
  updateStoryline: (id, data) => api.put(`/admin/storylines/${id}`, data),
  deleteStoryline: (id) => api.delete(`/admin/storylines/${id}`),

  getChapters: (params) => api.get("/admin/chapters", { params }),
  getChapter: (id) => api.get(`/admin/chapters/${id}`),
  createChapter: (data) => api.post("/admin/chapters", data),
  updateChapter: (id, data) => api.put(`/admin/chapters/${id}`, data),
  updateChapterStatus: (id, status) =>
    api.patch(`/admin/chapters/${id}/status`, { status }),
  deleteChapter: (id) => api.delete(`/admin/chapters/${id}`),

  getComments: (params) => api.get("/admin/comments", { params }),
  approveComment: (id) => api.patch(`/admin/comments/${id}/approve`),
  rejectComment: (id) => api.patch(`/admin/comments/${id}/reject`),
  deleteComment: (id) => api.delete(`/admin/comments/${id}`),

  getArtifacts: () => api.get("/admin/artifacts"),
  createArtifact: (data) => api.post("/admin/artifacts", data),
  updateArtifact: (id, data) => api.put(`/admin/artifacts/${id}`, data),
  deleteArtifact: (id) => api.delete(`/admin/artifacts/${id}`),

  getFigures: () => api.get("/admin/figures"),
  createFigure: (data) => api.post("/admin/figures", data),
  updateFigure: (id, data) => api.put(`/admin/figures/${id}`, data),
  deleteFigure: (id) => api.delete(`/admin/figures/${id}`),
};

export default api;
