import { io } from "socket.io-client";

const URL =
  process.env.NODE_ENV === "production"
    ? "https://cazahadas.onrender.com" // reemplaza con tu dominio real
    : "http://localhost:4000";

const socket = io(URL, {
  autoConnect: false,
});

export default socket;
