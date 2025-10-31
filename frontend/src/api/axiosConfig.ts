import axios from "axios";

const api = axios.create({
  baseURL: "https://miniprojectmanager-1-dhhu.onrender.com", 
});

export default api;

