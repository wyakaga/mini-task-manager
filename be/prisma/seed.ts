import { TaskStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

async function main() {
	console.log("Seeding database...");

	// Clear existing records
	await prisma.auditLog.deleteMany();
	await prisma.task.deleteMany();

	const task1 = await prisma.task.create({
		data: {
			title: "Set up project repository and database",
			description: "Initialize backend, configure Prisma with SQLite, and define schemas.",
			status: TaskStatus.DONE,
			auditLogs: {
				create: [
					{
						actor: "system",
						fromStatus: "todo",
						toStatus: "pending",
						timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4),
					},
					{
						actor: "developer",
						fromStatus: "pending",
						toStatus: "in_progress",
						timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
					},
					{
						actor: "developer",
						fromStatus: "in_progress",
						toStatus: "done",
						timestamp: new Date(Date.now() - 1000 * 60 * 30),
					},
				],
			},
		},
	});

	const task2 = await prisma.task.create({
		data: {
			title: "Implement GET /api/tasks endpoint",
			description: "Add filtering by status, search by query, and pagination with universal response envelopes.",
			status: TaskStatus.IN_PROGRESS,
			auditLogs: {
				create: [
					{
						actor: "developer",
						fromStatus: "todo",
						toStatus: "pending",
						timestamp: new Date(Date.now() - 1000 * 60 * 45),
					},
					{
						actor: "developer",
						fromStatus: "pending",
						toStatus: "in_progress",
						timestamp: new Date(Date.now() - 1000 * 60 * 15),
					},
				],
			},
		},
	});

	const task3 = await prisma.task.create({
		data: {
			title: "Design task board UI in React",
			description: "Create kanban columns and task cards with interactive status transitions.",
			status: TaskStatus.PENDING,
			auditLogs: {
				create: [
					{
						actor: "designer",
						fromStatus: "todo",
						toStatus: "pending",
						timestamp: new Date(Date.now() - 1000 * 60 * 10),
					},
				],
			},
		},
	});

	const task4 = await prisma.task.create({
		data: {
			title: "Write unit and integration tests",
			description: "Ensure status transitions and audit logs satisfy immutable lifecycle rules.",
			status: TaskStatus.TODO,
		},
	});

	const task5 = await prisma.task.create({
		data: {
			title: "Configure CI/CD and deployment pipeline",
			description: "Automate build, linting, and tests on push.",
			status: TaskStatus.TODO,
		},
	});

	console.log(`Seeded 5 sample tasks (${task1.id}, ${task2.id}, ${task3.id}, ${task4.id}, ${task5.id})`);
}

main()
	.catch((e) => {
		console.error("Seed failed:", e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
