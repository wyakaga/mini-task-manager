import test from "node:test";
import assert from "node:assert/strict";
import { Server } from "node:http";
import { createApp } from "@/app";

let server: Server;
let baseUrl: string;

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
	await new Promise<void>((resolve) => {
		server.close(() => resolve());
	});
});

test("GET /api/docs/ returns 200 and serves Swagger UI HTML", async () => {
	const res = await fetch(`${baseUrl}/api/docs/`);
	assert.strictEqual(res.status, 200);
	const text = await res.text();
	assert.ok(text.includes("swagger-ui"), "Response should include swagger-ui");
	assert.ok(text.includes("Mini Task Manager API Docs"), "Response should contain site title");
});

test("GET /docs/ returns 200 and serves Swagger UI HTML", async () => {
	const res = await fetch(`${baseUrl}/docs/`);
	assert.strictEqual(res.status, 200);
	const text = await res.text();
	assert.ok(text.includes("swagger-ui"), "Response should include swagger-ui");
});

test("GET /api-docs/ returns 200 and serves Swagger UI HTML", async () => {
	const res = await fetch(`${baseUrl}/api-docs/`);
	assert.strictEqual(res.status, 200);
	const text = await res.text();
	assert.ok(text.includes("swagger-ui"), "Response should include swagger-ui");
});

test("GET /api/docs.json returns 200 and valid OpenAPI 3.0 specification", async () => {
	const res = await fetch(`${baseUrl}/api/docs.json`);
	assert.strictEqual(res.status, 200);
	assert.ok(res.headers.get("content-type")?.includes("application/json"));

	const spec = await res.json();
	assert.strictEqual(spec.openapi, "3.0.3");
	assert.strictEqual(spec.info.title, "Mini Task Manager API");
	assert.strictEqual(spec.info.version, "1.0.0");

	// Verify all paths start with /api/
	const pathKeys = Object.keys(spec.paths);
	assert.ok(pathKeys.length > 0, "Paths should not be empty");
	for (const p of pathKeys) {
		assert.ok(p.startsWith("/api/"), `Path ${p} must be prefixed with /api/`);
	}

	// Verify required endpoint paths
	assert.ok(spec.paths["/api/tasks"]);
	assert.ok(spec.paths["/api/tasks/{id}/status"]);
	assert.ok(spec.paths["/api/tasks/{id}"]);
	assert.ok(spec.paths["/api/tasks/{id}/audit-logs"]);
	assert.ok(spec.paths["/api/health"]);

	// Verify schemas exist
	assert.ok(spec.components?.schemas?.Task);
	assert.ok(spec.components?.schemas?.AuditLog);
	assert.ok(spec.components?.schemas?.TaskStatus);
	assert.ok(spec.components?.schemas?.PaginationMeta);
});

test("GET /api-docs.json and /docs.json return valid OpenAPI JSON specification", async () => {
	for (const path of ["/api-docs.json", "/docs.json"]) {
		const res = await fetch(`${baseUrl}${path}`);
		assert.strictEqual(res.status, 200);
		const spec = await res.json();
		assert.strictEqual(spec.openapi, "3.0.3");
	}
});
