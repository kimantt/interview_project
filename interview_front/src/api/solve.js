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

// 싱글플레이 전용 범위 설정
export async function configureSingleSolveScope(questionIds) {
  await axiosInstance.post("/solve/single/scope", { questionIds });
}

// 싱글플레이 현재 상태 조회
export async function fetchSingleSolveState() {
  const res = await axiosInstance.get("/solve/single/state");
  return res.data;
}

// 싱글플레이 다음/이전 이동
export async function nextSingleSolve() {
  const res = await axiosInstance.post("/solve/single/next");
  return res.data;
}

export async function prevSingleSolve() {
  const res = await axiosInstance.post("/solve/single/prev");
  return res.data;
}