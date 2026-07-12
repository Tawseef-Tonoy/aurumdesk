import { useEffect, useState } from "react";
import apiClient from "./api/apiClient";

function App() {
  const [message, setMessage] = useState("Connecting...");

  useEffect(() => {
    async function checkBackend() {
      try {
        const response = await apiClient.get("/health");
        setMessage(response.data.message);
      } catch (error) {
        console.error(error);
        setMessage("Backend connection failed");
      }
    }

    checkBackend();
  }, []);

  return (
    <main className="container py-5">
      <h1>AurumDesk</h1>
      <p>{message}</p>
    </main>
  );
}

export default App;