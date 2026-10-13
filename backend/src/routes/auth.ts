import { FastifyInstance } from "fastify";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { prisma } from "../db.js";

export async function authRoutes(server: FastifyInstance) {
  
  // ----------------------------------------------------------------
  // 1. REGISTRATION
  // POST /auth/register
  // ----------------------------------------------------------------
  server.post("/register", async (request, reply) => {
    const { email, name, password } = request.body as {
      email: string;
      name?: string;
      password: string;
    };

    if (!email || !password) {
      return reply.status(400).send({ message: "Email and password are required" });
    }

    try {
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return reply.status(400).send({ message: "Email already registered" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await prisma.user.create({
        data: { 
          email, 
          name, 
          password: hashedPassword, 
          role: 'user' // Default role
        },
      });

      return reply.status(201).send({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      });
      
    } catch (err) {
      server.log.error(err);
      return reply.status(500).send({ message: "Internal Server Error" });
    }
  });

  // ----------------------------------------------------------------
  // 2. LOGIN
  // POST /auth/login
  // ----------------------------------------------------------------
  server.post("/login", async (request, reply) => {
    const { email, password } = request.body as { email: string; password: string };

    if (!email || !password) {
      return reply.status(400).send({ message: "Email and password are required" });
    }

    try {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        return reply.status(400).send({ message: "Invalid email or password" });
      }

      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return reply.status(400).send({ message: "Invalid email or password" });
      }

      // Generate JWT
      const token = server.jwt.sign({ sub: user.id, role: user.role });

      return reply.send({
        token,
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
      });

    } catch (err) {
      server.log.error(err);
      return reply.status(500).send({ message: "Internal Server Error" });
    }
  });

  // ----------------------------------------------------------------
  // 2.5. CURRENT USER
  // GET /auth/me
  // ----------------------------------------------------------------
  server.get("/me", { preHandler: [server.authenticate] }, async (request, reply) => {
    try {
      const userPayload = request.user as { sub: number | string; role: string };
      const user = await prisma.user.findUnique({
        where: { id: Number(userPayload.sub) },
        select: { id: true, email: true, name: true, role: true },
      });
      if (!user) {
        return reply.status(404).send({ message: "User not found" });
      }
      return reply.send({ user });
    } catch (err) {
      server.log.error(err);
      return reply.status(500).send({ message: "Internal Server Error" });
    }
  });

  // ----------------------------------------------------------------
  // 3. FORGOT PASSWORD (Request Reset)
  // POST /auth/forgot-password
  // ----------------------------------------------------------------
  server.post("/forgot-password", async (request, reply) => {
    const { email } = request.body as { email: string };

    try {
      const user = await prisma.user.findUnique({ where: { email } });
      
      // Security tip: Even if user doesn't exist, we usually return a success 
      // message to prevent "email harvesting," but for your dev testing:
      if (!user) return reply.status(404).send({ message: "User not found" });

      const token = crypto.randomBytes(32).toString('hex');
      const expiry = new Date(Date.now() + 3600000); // Valid for 1 hour

      await prisma.user.update({
        where: { email },
        data: { 
          resetToken: token, 
          resetTokenExpiry: expiry 
        }
      });

      // In a real app, you'd send an email here.
      return reply.send({ 
        message: "Reset token generated successfully", 
        token // Return token so you can copy it into Postman
      });

    } catch (err) {
      server.log.error(err);
      return reply.status(500).send({ message: "Error generating reset token" });
    }
  });

  // ----------------------------------------------------------------
  // 4. RESET PASSWORD (Apply Reset)
  // POST /auth/reset-password
  // ----------------------------------------------------------------
  server.post("/reset-password", async (request, reply) => {
    const { token, newPassword } = request.body as { token: string, newPassword: string };

    if (!token || !newPassword) {
      return reply.status(400).send({ message: "Token and new password are required" });
    }

    try {
      const user = await prisma.user.findFirst({
        where: {
          resetToken: token,
          resetTokenExpiry: { gt: new Date() } // Check if token is not expired
        }
      });

      if (!user) {
        return reply.status(400).send({ message: "Invalid or expired reset token" });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          resetToken: null,       // Clear token after use
          resetTokenExpiry: null  // Clear expiry after use
        }
      });

      return reply.send({ message: "Password updated successfully! You can now login." });

    } catch (err) {
      server.log.error(err);
      return reply.status(500).send({ message: "Error resetting password" });
    }
  });
}