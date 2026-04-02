import axiosInstance from "./axiosInstance";

export async function loginApi(username, password) {
  const res = await axiosInstance.post("/auth/login", { username, password });
  return res.data;
}

export async function logoutApi() {
  await axiosInstance.post("/auth/logout");
}

export async function meApi() {
  const res = await axiosInstance.get("/auth/me");
  return res.data;
}