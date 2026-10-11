import test from "node:test";
import assert from "node:assert/strict";
import { Server } from "node:http";
import { createApp } from "@/app";
import { prisma } from "@/lib/prisma";

let server: Server;
let baseUrl: string;
const createdTaskIds: string[] = [];

test.before(async () => {
	const app = createApp();
	await new Promise<void>((resolve) => {
		server = app.listen(0, () => {
			const address = server.address();
			if (address && typeof address === "object") {
				baseUrl = `http://localhost:${address.port}`;
			}
			resolve();
		});
	});
});

test.after(async () => {
	if (createdTaskIds.length > 0) {
		await prisma.task.deleteMany({
			where: { id: { in: createdTaskIds } },
		});
	}
	await prisma.$disconnect();
	await new Promise<void>((resolve) => {
		server.close(() => resolve());
	});
});

test("POST /api/tasks creates a task with title and description", async () => {
	const payload = {
		title: "Test Task 1",
		description: "Test Description 1",
	};

	const res = await fetch(`${baseUrl}/api/tasks`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(payload),
	});

	assert.strictEqual(res.status, 201);
	const data = await res.json();

	assert.strictEqual(data.status, "success");
	assert.ok(data.data.id);
	assert.strictEqual(data.data.title, payload.title);
	assert.strictEqual(data.data.description, payload.description);
	assert.strictEqual(data.data.status, "todo");
	assert.ok(data.data.createdAt);
	assert.ok(data.data.updatedAt);

	createdTaskIds.push(data.data.id);

	// Verify in database
	const dbTask = await prisma.task.findUnique({
		where: { id: data.data.id },
	});
	assert.ok(dbTask);
	assert.strictEqual(dbTask.title, payload.title);
	assert.strictEqual(dbTask.status, "TODO");
});

test("POST /tasks without /api prefix returns 404 Route not found", async () => {
	const payload = {
		title: "Root Route Task",
		description: "Created via /tasks",
	};

	const res = await fetch(`${baseUrl}/tasks`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(payload),
	});

	assert.strictEqual(res.status, 404);
	const data = await res.json();
	assert.strictEqual(data.status, "error");
	assert.strictEqual(data.message, "Route not found");
});

test("POST /api/tasks creates a task without description (defaults to null)", async () => {
	const payload = {
		title: "Task Without Description",
	};

	const res = await fetch(`${baseUrl}/api/tasks`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(payload),
	});

	assert.strictEqual(res.status, 201);
	const data = await res.json();
	assert.strictEqual(data.status, "success");
	assert.strictEqual(data.data.title, payload.title);
	assert.strictEqual(data.data.description, null);
	assert.strictEqual(data.data.status, "todo");

	createdTaskIds.push(data.data.id);
});

test("POST /api/tasks transforms empty/whitespace description to null", async () => {
	const payload = {
		title: "Task With Empty Description",
		description: "    ",
	};

	const res = await fetch(`${baseUrl}/api/tasks`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(payload),
	});

	assert.strictEqual(res.status, 201);
	const data = await res.json();
	assert.strictEqual(data.status, "success");
	assert.strictEqual(data.data.title, payload.title);
	assert.strictEqual(data.data.description, null);

	createdTaskIds.push(data.data.id);
});

test("POST /api/tasks allows explicit status 'todo'", async () => {
	const payload = {
		title: "Task With Explicit Todo",
		status: "todo",
	};

	const res = await fetch(`${baseUrl}/api/tasks`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(payload),
	});

	assert.strictEqual(res.status, 201);
	const data = await res.json();
	assert.strictEqual(data.status, "success");
	assert.strictEqual(data.data.status, "todo");

	createdTaskIds.push(data.data.id);
});

test("POST /api/tasks rejects non-todo initial status with 400", async () => {
	for (const invalidStatus of ["in_progress", "pending", "done", "random"]) {
		const res = await fetch(`${baseUrl}/api/tasks`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				title: `Task with ${invalidStatus}`,
				status: invalidStatus,
			}),
		});

		assert.strictEqual(res.status, 400);
		const data = await res.json();
		assert.strictEqual(data.status, "error");
		assert.strictEqual(data.message, "Validation failed");
	}
});

test("POST /api/tasks rejects missing or empty title with 400", async () => {
	const invalidPayloads = [
		{},
		{ title: "" },
		{ title: "   " },
		{ title: null },
		{ title: 123 },
	];

	for (const payload of invalidPayloads) {
		const res = await fetch(`${baseUrl}/api/tasks`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(payload),
		});

		assert.strictEqual(res.status, 400);
		const data = await res.json();
		assert.strictEqual(data.status, "error");
		assert.strictEqual(data.message, "Validation failed");
	}
});
