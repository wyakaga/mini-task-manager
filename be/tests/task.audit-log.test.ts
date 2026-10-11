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
		await prisma.auditLog.deleteMany({
			where: { taskId: { in: createdTaskIds } },
		});
		await prisma.task.deleteMany({
			where: { id: { in: createdTaskIds } },
		});
	}
	await prisma.$disconnect();
	await new Promise<void>((resolve) => {
		server.close(() => resolve());
	});
});

async function createTestTask(title: string = "Audit Log Test Task"): Promise<string> {
	const task = await prisma.task.create({
		data: {
			title,
			description: "Task for testing audit log endpoint",
			status: "TODO",
		},
	});
	createdTaskIds.push(task.id);
	return task.id;
}

test("GET /api/tasks/:id/audit-logs returns empty array for new task with no transitions", async () => {
	const taskId = await createTestTask("New Task Without Transitions");

	const res = await fetch(`${baseUrl}/api/tasks/${taskId}/audit-logs`);
	assert.strictEqual(res.status, 200);

	const body = await res.json();
	assert.strictEqual(body.status, "success");
	assert.deepStrictEqual(body.data, []);
});

test("GET /api/tasks/:id/audit-logs returns chronological audit logs (ASC order)", async () => {
	const taskId = await createTestTask("Task With Multiple Transitions");

	// Transition 1: todo -> pending
	await fetch(`${baseUrl}/api/tasks/${taskId}/status`, {
		method: "PATCH",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ status: "pending", actor: "alice" }),
	});

	// Transition 2: pending -> in_progress
	await fetch(`${baseUrl}/api/tasks/${taskId}/status`, {
		method: "PATCH",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ status: "in_progress", actor: "bob" }),
	});

	// Transition 3: in_progress -> done
	await fetch(`${baseUrl}/api/tasks/${taskId}/status`, {
		method: "PATCH",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ status: "done", actor: "charlie" }),
	});

	const res = await fetch(`${baseUrl}/api/tasks/${taskId}/audit-logs`);
	assert.strictEqual(res.status, 200);

	const body = await res.json();
	assert.strictEqual(body.status, "success");
	assert.strictEqual(Array.isArray(body.data), true);
	assert.strictEqual(body.data.length, 3);

	const [log1, log2, log3] = body.data;

	assert.strictEqual(log1.taskId, taskId);
	assert.strictEqual(log1.actor, "alice");
	assert.strictEqual(log1.fromStatus, "todo");
	assert.strictEqual(log1.toStatus, "pending");
	assert.ok(log1.timestamp);

	assert.strictEqual(log2.taskId, taskId);
	assert.strictEqual(log2.actor, "bob");
	assert.strictEqual(log2.fromStatus, "pending");
	assert.strictEqual(log2.toStatus, "in_progress");
	assert.ok(log2.timestamp);

	assert.strictEqual(log3.taskId, taskId);
	assert.strictEqual(log3.actor, "charlie");
	assert.strictEqual(log3.fromStatus, "in_progress");
	assert.strictEqual(log3.toStatus, "done");
	assert.ok(log3.timestamp);

	// Verify chronological order (timestamp ASC)
	const time1 = new Date(log1.timestamp).getTime();
	const time2 = new Date(log2.timestamp).getTime();
	const time3 = new Date(log3.timestamp).getTime();
	assert.ok(time1 <= time2, "log1 timestamp must be <= log2 timestamp");
	assert.ok(time2 <= time3, "log2 timestamp must be <= log3 timestamp");
});

test("GET /tasks/:id/audit-logs without /api prefix returns 404 Route not found", async () => {
	const taskId = await createTestTask("Root Route Audit Logs Task");

	const res = await fetch(`${baseUrl}/tasks/${taskId}/audit-logs`);
	assert.strictEqual(res.status, 404);

	const body = await res.json();
	assert.strictEqual(body.status, "error");
	assert.strictEqual(body.message, "Route not found");
});

test("GET /api/tasks/:id/audit-logs preserves and returns audit logs for soft-deleted task", async () => {
	const taskId = await createTestTask("Soft Deleted Task With Logs");

	// Perform a transition
	await fetch(`${baseUrl}/api/tasks/${taskId}/status`, {
		method: "PATCH",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ status: "pending", actor: "eve" }),
	});

	// Soft delete task
	const delRes = await fetch(`${baseUrl}/api/tasks/${taskId}`, {
		method: "DELETE",
	});
	assert.strictEqual(delRes.status, 200);

	// Fetch audit logs for the soft-deleted task
	const res = await fetch(`${baseUrl}/api/tasks/${taskId}/audit-logs`);
	assert.strictEqual(res.status, 200);

	const body = await res.json();
	assert.strictEqual(body.status, "success");
	assert.strictEqual(body.data.length, 1);
	assert.strictEqual(body.data[0].actor, "eve");
	assert.strictEqual(body.data[0].fromStatus, "todo");
	assert.strictEqual(body.data[0].toStatus, "pending");
});

test("GET /api/tasks/:id/audit-logs does not include audit logs when idempotent status updates occur", async () => {
	const taskId = await createTestTask("Idempotent Audit Check Task");

	// Idempotent update (todo -> todo)
	await fetch(`${baseUrl}/api/tasks/${taskId}/status`, {
		method: "PATCH",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ status: "todo", actor: "frank" }),
	});

	const res = await fetch(`${baseUrl}/api/tasks/${taskId}/audit-logs`);
	assert.strictEqual(res.status, 200);

	const body = await res.json();
	assert.strictEqual(body.status, "success");
	assert.deepStrictEqual(body.data, []);
});

test("GET /api/tasks/:id/audit-logs returns 404 for non-existent task UUID", async () => {
	const nonExistentUuid = "00000000-0000-0000-0000-000000000000";
	const res = await fetch(`${baseUrl}/api/tasks/${nonExistentUuid}/audit-logs`);
	assert.strictEqual(res.status, 404);

	const body = await res.json();
	assert.strictEqual(body.status, "error");
	assert.strictEqual(body.message, "Task not found");
});

test("GET /api/tasks/:id/audit-logs returns 400 for invalid UUID format", async () => {
	const res = await fetch(`${baseUrl}/api/tasks/not-a-valid-uuid/audit-logs`);
	assert.strictEqual(res.status, 400);

	const body = await res.json();
	assert.strictEqual(body.status, "error");
	assert.strictEqual(body.message, "Validation failed");
});
