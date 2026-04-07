import axiosInstance from "./axiosInstance";

// 현재 문제에 대한 내 답안을 조회
export async function fetchMyAnswer(question) {
  const res = await axiosInstance.get("/solve/my-answer", { params: { question } });
  return res.data;
}

export async function upsertMyAnswer(question, answer) {
  await axiosInstance.post("/solve/my-answer", { question, answer });
}

// solve 시작 전에 사용할 문제 범위를 서버에 저장
export async function configureSolveScope(questionIds) {
  await axiosInstance.post("/solve/scope", { questionIds });
}