import axiosInstance from "./axiosInstance";

export async function fetchManageQuestions() {
  const res = await axiosInstance.get("/questions/manage/list");
  return res.data;
}

export async function fetchManageCategories() {
  const res = await axiosInstance.get("/questions/manage/categories");
  return res.data;
}

export async function createQuestion(payload) {
  await axiosInstance.post("/questions/manage", payload);
}

export async function updateQuestionMeta(questionId, payload) {
  await axiosInstance.put(`/questions/manage/${questionId}/meta`, payload);
}

export async function upsertMyAnswer(questionId, payload) {
  await axiosInstance.put(`/questions/manage/${questionId}/answer`, payload);
}

export async function deleteQuestion(questionId) {
  await axiosInstance.delete(`/questions/manage/${questionId}`);
}