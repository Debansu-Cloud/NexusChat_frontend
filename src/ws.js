import { io } from 'socket.io-client';

export function connectWS() {
    // Vite uses import.meta.env. If you use Create React App, it would be process.env.REACT_APP_BACKEND_URL
    const backendUrl =  'https://nexuschat-backend-1.onrender.com';
    return io(backendUrl);
}
