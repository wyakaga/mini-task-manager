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

async function createTestTask(title: string = "Status Test Task"): Promise<string> {
	const task = await prisma.task.create({
		data: {
			title,
			description: "Task for testing status updates",
			status: "TODO",
		},
	});
	createdTaskIds.push(task.id);
	return task.id;
}

test("PATCH /api/tasks/:id/status follows linear progression: todo -> pending -> in_progress -> done", async () => {
	const taskId = await createTestTask("Progression Task");

	// Step 1: todo -> pending
	const res1 = await fetch(`${baseUrl}/api/tasks/${taskId}/status`, {
		method: "PATCH",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ status: "pending", actor: "agent-1" }),
	});
	assert.strictEqual(res1.status, 200);
	const data1 = await res1.json();
	assert.strictEqual(data1.status, "success");
	assert.strictEqual(data1.data.id, taskId);
	assert.strictEqual(data1.data.status, "pending");

	// Step 2: pending -> in_progress
	const res2 = await fetch(`${baseUrl}/api/tasks/${taskId}/status`, {
		method: "PATCH",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ status: "in_progress", actor: "agent-2" }),
	});
	assert.strictEqual(res2.status, 200);
	const data2 = await res2.json();
	assert.strictEqual(data2.data.status, "in_progress");

	// Step 3: in_progress -> done
	const res3 = await fetch(`${baseUrl}/api/tasks/${taskId}/status`, {
		method: "PATCH",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ status: "done", actor: "agent-3" }),
	});
	assert.strictEqual(res3.status, 200);
	const data3 = await res3.json();
	assert.strictEqual(data3.data.status, "done");

	// Verify database audit logs
	const logs = await prisma.auditLog.findMany({
		where: { taskId },
		orderBy: { timestamp: "asc" },
	});
	assert.strictEqual(logs.length, 3);
	assert.ok(logs[0]);
	assert.ok(logs[1]);
	assert.ok(logs[2]);

	assert.strictEqual(logs[0].actor, "agent-1");
	assert.strictEqual(logs[0].fromStatus, "todo");
	assert.strictEqual(logs[0].toStatus, "pending");

	assert.strictEqual(logs[1].actor, "agent-2");
	assert.strictEqual(logs[1].fromStatus, "pending");
	assert.strictEqual(logs[1].toStatus, "in_progress");

	assert.strictEqual(logs[2].actor, "agent-3");
	assert.strictEqual(logs[2].fromStatus, "in_progress");
	assert.strictEqual(logs[2].toStatus, "done");

});

test("PATCH /tasks/:id/status without /api prefix returns 404 Route not found", async () => {
	const taskId = await createTestTask("Root Route Status Task");

	const res = await fetch(`${baseUrl}/tasks/${taskId}/status`, {
		method: "PATCH",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ status: "pending", actor: "root-agent" }),
	});

	assert.strictEqual(res.status, 404);
	const data = await res.json();
	assert.strictEqual(data.status, "error");
	assert.strictEqual(data.message, "Route not found");
});

test("PATCH /api/tasks/:id/status rejects actor sent via header and requires actor in body", async () => {
	const taskId = await createTestTask("Header Only Actor Task");

	const res = await fetch(`${baseUrl}/api/tasks/${taskId}/status`, {
		method: "PATCH",
		headers: {
			"Content-Type": "application/json",
			"x-actor": "header-alice",
		},
		body: JSON.stringify({ status: "pending" }),
	});

	assert.strictEqual(res.status, 400);
	const data = await res.json();
	assert.strictEqual(data.status, "error");
});

test("PATCH /api/tasks/:id/status rejects missing or empty actor in body with 400", async () => {
	const taskId = await createTestTask("Missing Actor Task");

	// Missing actor in body
	const resMissing = await fetch(`${baseUrl}/api/tasks/${taskId}/status`, {
		method: "PATCH",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ status: "pending" }),
	});
	assert.strictEqual(resMissing.status, 400);

	// Empty string actor in body
	const resEmptyBody = await fetch(`${baseUrl}/api/tasks/${taskId}/status`, {
		method: "PATCH",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ status: "pending", actor: "   " }),
	});
	assert.strictEqual(resEmptyBody.status, 400);
});

test("PATCH /api/tasks/:id/status is idempotent when target status matches current status", async () => {
	const taskId = await createTestTask("Idempotent Task");

	// Task starts at todo. Sending status "todo"
	const res = await fetch(`${baseUrl}/api/tasks/${taskId}/status`, {
		method: "PATCH",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ status: "todo", actor: "idempotent-agent" }),
	});

	assert.strictEqual(res.status, 200);
	const data = await res.json();
	assert.strictEqual(data.status, "success");
	assert.strictEqual(data.data.status, "todo");

	// Verify no audit log was created
	const count = await prisma.auditLog.count({
		where: { taskId },
	});
	assert.strictEqual(count, 0);
});

test("PATCH /api/tasks/:id/status allows backward progression: done -> in_progress -> pending -> todo", async () => {
	const taskId = await createTestTask("Backward Progression Task");

	// Move forward to done first: todo -> pending -> in_progress -> done
	for (const st of ["pending", "in_progress", "done"]) {
		const res = await fetch(`${baseUrl}/api/tasks/${taskId}/status`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ status: st, actor: `fwd-${st}` }),
		});
		assert.strictEqual(res.status, 200);
	}

	// Now move backward: done -> in_progress
	const resBack1 = await fetch(`${baseUrl}/api/tasks/${taskId}/status`, {
		method: "PATCH",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ status: "in_progress", actor: "rev-1" }),
	});
	assert.strictEqual(resBack1.status, 200);
	const dataBack1 = await resBack1.json();
	assert.strictEqual(dataBack1.data.status, "in_progress");

	// in_progress -> pending
	const resBack2 = await fetch(`${baseUrl}/api/tasks/${taskId}/status`, {
		method: "PATCH",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ status: "pending", actor: "rev-2" }),
	});
	assert.strictEqual(resBack2.status, 200);
	const dataBack2 = await resBack2.json();
	assert.strictEqual(dataBack2.data.status, "pending");

	// pending -> todo
	const resBack3 = await fetch(`${baseUrl}/api/tasks/${taskId}/status`, {
		method: "PATCH",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ status: "todo", actor: "rev-3" }),
	});
	assert.strictEqual(resBack3.status, 200);
	const dataBack3 = await resBack3.json();
	assert.strictEqual(dataBack3.data.status, "todo");

	// Verify all 6 audit logs
	const logs = await prisma.auditLog.findMany({
		where: { taskId },
		orderBy: { timestamp: "asc" },
	});
	assert.strictEqual(logs.length, 6);
	assert.ok(logs[3]);
	assert.ok(logs[4]);
	assert.ok(logs[5]);
	assert.strictEqual(logs[3].fromStatus, "done");
	assert.strictEqual(logs[3].toStatus, "in_progress");
	assert.strictEqual(logs[3].actor, "rev-1");

	assert.strictEqual(logs[4].fromStatus, "in_progress");
	assert.strictEqual(logs[4].toStatus, "pending");
	assert.strictEqual(logs[4].actor, "rev-2");

	assert.strictEqual(logs[5].fromStatus, "pending");
	assert.strictEqual(logs[5].toStatus, "todo");
	assert.strictEqual(logs[5].actor, "rev-3");
});

test("PATCH /api/tasks/:id/status rejects non-adjacent skips with 400", async () => {
	const taskId = await createTestTask("Invalid Skips Task");

	// Attempt forward skips from todo: cannot jump to in_progress or done
	for (const skipStatus of ["in_progress", "done"]) {
		const res = await fetch(`${baseUrl}/api/tasks/${taskId}/status`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ status: skipStatus, actor: "tester" }),
		});
		assert.strictEqual(res.status, 400);
		const data = await res.json();
		assert.strictEqual(data.status, "error");
	}

	// Move to pending
	await fetch(`${baseUrl}/api/tasks/${taskId}/status`, {
		method: "PATCH",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ status: "pending", actor: "tester" }),
	});

	// Attempt forward skip from pending -> done (cannot jump over in_progress)
	const resSkipPending = await fetch(`${baseUrl}/api/tasks/${taskId}/status`, {
		method: "PATCH",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ status: "done", actor: "tester" }),
	});
	assert.strictEqual(resSkipPending.status, 400);

	// Move to in_progress
	await fetch(`${baseUrl}/api/tasks/${taskId}/status`, {
		method: "PATCH",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ status: "in_progress", actor: "tester" }),
	});

	// Attempt backward skip from in_progress -> todo (cannot jump over pending)
	const resSkipInProgress = await fetch(`${baseUrl}/api/tasks/${taskId}/status`, {
		method: "PATCH",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ status: "todo", actor: "tester" }),
	});
	assert.strictEqual(resSkipInProgress.status, 400);

	// Move to done
	await fetch(`${baseUrl}/api/tasks/${taskId}/status`, {
		method: "PATCH",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ status: "done", actor: "tester" }),
	});

	// Attempt backward skips from done -> pending or todo (cannot jump over in_progress)
	for (const revStatus of ["pending", "todo"]) {
		const res = await fetch(`${baseUrl}/api/tasks/${taskId}/status`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ status: revStatus, actor: "tester" }),
		});
		assert.strictEqual(res.status, 400);
	}
});

test("PATCH /api/tasks/:id/status returns 404 for non-existent task", async () => {
	const nonExistentUuid = "00000000-0000-0000-0000-000000000000";
	const res = await fetch(`${baseUrl}/api/tasks/${nonExistentUuid}/status`, {
		method: "PATCH",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ status: "pending", actor: "tester" }),
	});

	assert.strictEqual(res.status, 404);
	const data = await res.json();
	assert.strictEqual(data.status, "error");
	assert.strictEqual(data.message, "Task not found");
});

test("PATCH /api/tasks/:id/status returns 400 for invalid UUID format", async () => {
	const res = await fetch(`${baseUrl}/api/tasks/not-a-uuid/status`, {
		method: "PATCH",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ status: "pending", actor: "tester" }),
	});

	assert.strictEqual(res.status, 400);
	const data = await res.json();
	assert.strictEqual(data.status, "error");
	assert.strictEqual(data.message, "Validation failed");
});
