import axios from "axios";

const API = axios.create({
  baseURL: "https://report-9coj.onrender.com/api",
});

export default API;