import axiosInstance from "./axiosInstance";

export async function fetchParticipants() {
  const res = await axiosInstance.get("/study/participants");
  return res.data;
}