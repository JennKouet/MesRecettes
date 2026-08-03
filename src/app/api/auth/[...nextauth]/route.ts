import { handlers } from "@/auth";

export const { GET, POST } = handlers;

// bcrypt et Prisma exigent le runtime Node.
export const runtime = "nodejs";
