import dotenv from "dotenv";
import { createApp } from "@/app";

dotenv.config();

const app = createApp();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000;

const server = app.listen(PORT, () => {
	console.log(`Server listening on http://localhost:${PORT}`);
});

process.on("SIGINT", () => {
	server.close(() => {
		console.log("Server closed");
		process.exit(0);
	});
});

process.on("SIGTERM", () => {
	server.close(() => {
		console.log("Server terminated");
		process.exit(0);
	});
});
