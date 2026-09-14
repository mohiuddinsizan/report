import axios from "axios";

// const API = axios.create({
//   baseURL: "https://report-9coj.onrender.com/api",
// });

// const API_URL = "http://localhost:5000/api/upload-result";


const API = axios.create({
  baseURL: "http://localhost:5000/api/upload-result",
});


export default API;