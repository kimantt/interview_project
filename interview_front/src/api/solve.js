import axiosInstance from "./axiosInstance";

export async function fetchMyAnswer(question) {
  const res = await axiosInstance.get("/solve/my-answer", { params: { question } });
  return res.data;
}

export async function upsertMyAnswer(question, answer) {
  await axiosInstance.post("/solve/my-answer", { question, answer });
}

export async function configureSolveScope(questionIds) {
  await axiosInstance.post("/solve/scope", { questionIds });
}