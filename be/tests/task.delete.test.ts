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

async function createTestTask(title: string = "Delete Test Task"): Promise<string> {
	const task = await prisma.task.create({
		data: {
			title,
			description: "Task for testing soft delete",
			status: "TODO",
		},
	});
	createdTaskIds.push(task.id);
	return task.id;
}

test("DELETE /api/tasks/:id soft deletes task by setting deletedAt timestamp", async () => {
	const taskId = await createTestTask("Task to soft delete");

	const res = await fetch(`${baseUrl}/api/tasks/${taskId}`, {
		method: "DELETE",
	});

	assert.strictEqual(res.status, 200);
	const body = await res.json();

	assert.strictEqual(body.status, "success");
	assert.strictEqual(body.data.id, taskId);
	assert.ok(body.data.deletedAt, "deletedAt should be set in response");
	assert.strictEqual(body.message, "Task deleted successfully");

	// Verify in database that deletedAt is populated
	const dbTask = await prisma.task.findUnique({
		where: { id: taskId },
	});
	assert.ok(dbTask, "Record should still exist in database");
	assert.ok(dbTask?.deletedAt, "deletedAt should be non-null in DB");
});

test("DELETE /tasks/:id without /api prefix returns 404 Route not found", async () => {
	const taskId = await createTestTask("Root Route Delete Task");

	const res = await fetch(`${baseUrl}/tasks/${taskId}`, {
		method: "DELETE",
	});

	assert.strictEqual(res.status, 404);
	const body = await res.json();
	assert.strictEqual(body.status, "error");
	assert.strictEqual(body.message, "Route not found");
});

test("GET /api/tasks excludes soft-deleted tasks", async () => {
	const task1Id = await createTestTask("Active Task");
	const task2Id = await createTestTask("To be deleted Task");

	// Delete task2
	const delRes = await fetch(`${baseUrl}/api/tasks/${task2Id}`, {
		method: "DELETE",
	});
	assert.strictEqual(delRes.status, 200);

	// Fetch tasks list
	const listRes = await fetch(`${baseUrl}/api/tasks`);
	assert.strictEqual(listRes.status, 200);
	const listBody = await listRes.json();

	const ids = listBody.data.map((t: { id: string }) => t.id);
	assert.ok(ids.includes(task1Id), "Active task must be included");
	assert.ok(!ids.includes(task2Id), "Soft-deleted task must be excluded");
});

test("DELETE /api/tasks/:id returns 404 when task is already soft-deleted", async () => {
	const taskId = await createTestTask("Already Deleted Task");

	// First delete
	const res1 = await fetch(`${baseUrl}/api/tasks/${taskId}`, {
		method: "DELETE",
	});
	assert.strictEqual(res1.status, 200);

	// Second delete should return 404
	const res2 = await fetch(`${baseUrl}/api/tasks/${taskId}`, {
		method: "DELETE",
	});
	assert.strictEqual(res2.status, 404);
	const body2 = await res2.json();
	assert.strictEqual(body2.status, "error");
	assert.strictEqual(body2.message, "Task not found");
});

test("PATCH /api/tasks/:id/status returns 404 on a soft-deleted task", async () => {
	const taskId = await createTestTask("Task before soft delete");

	// Soft delete the task
	await fetch(`${baseUrl}/api/tasks/${taskId}`, {
		method: "DELETE",
	});

	// Attempt to update status
	const res = await fetch(`${baseUrl}/api/tasks/${taskId}/status`, {
		method: "PATCH",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ status: "pending", actor: "tester" }),
	});

	assert.strictEqual(res.status, 404);
	const body = await res.json();
	assert.strictEqual(body.status, "error");
	assert.strictEqual(body.message, "Task not found");
});

test("Soft deleting a task preserves existing audit logs", async () => {
	const taskId = await createTestTask("Task with audit logs");

	// Advance status to pending to generate an audit log entry
	const patchRes = await fetch(`${baseUrl}/api/tasks/${taskId}/status`, {
		method: "PATCH",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ status: "pending", actor: "agent-alpha" }),
	});
	assert.strictEqual(patchRes.status, 200);

	// Verify audit log exists
	const logsBefore = await prisma.auditLog.findMany({
		where: { taskId },
	});
	assert.strictEqual(logsBefore.length, 1);

	// Soft delete the task
	const delRes = await fetch(`${baseUrl}/api/tasks/${taskId}`, {
		method: "DELETE",
	});
	assert.strictEqual(delRes.status, 200);

	// Verify audit logs are still intact in DB
	const logsAfter = await prisma.auditLog.findMany({
		where: { taskId },
	});
	assert.strictEqual(logsAfter.length, 1);
	assert.strictEqual(logsAfter[0]?.actor, "agent-alpha");
	assert.strictEqual(logsAfter[0]?.fromStatus, "todo");
	assert.strictEqual(logsAfter[0]?.toStatus, "pending");
});

test("DELETE /api/tasks/:id returns 400 for invalid UUID format", async () => {
	const res = await fetch(`${baseUrl}/api/tasks/invalid-uuid-123`, {
		method: "DELETE",
	});

	assert.strictEqual(res.status, 400);
	const body = await res.json();
	assert.strictEqual(body.status, "error");
	assert.strictEqual(body.message, "Validation failed");
});

test("DELETE /api/tasks/:id returns 404 for non-existent UUID", async () => {
	const nonExistentId = "00000000-0000-0000-0000-000000000000";
	const res = await fetch(`${baseUrl}/api/tasks/${nonExistentId}`, {
		method: "DELETE",
	});

	assert.strictEqual(res.status, 404);
	const body = await res.json();
	assert.strictEqual(body.status, "error");
	assert.strictEqual(body.message, "Task not found");
});
