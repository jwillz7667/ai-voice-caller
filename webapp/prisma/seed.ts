import { PrismaClient, UserRole, UserStatus, NotificationType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  // Create admin user
  const adminPassword = await bcrypt.hash("Admin@123456", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@verbio.ai" },
    update: {},
    create: {
      email: "admin@verbio.ai",
      password: adminPassword,
      name: "Admin User",
      username: "admin",
      role: UserRole.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
      emailVerified: true,
      emailVerifiedAt: new Date(),
      credits: 10000,
      permissions: ["*"],
      metadata: {
        createdBy: "system",
        purpose: "seed"
      }
    }
  });

  console.log("✅ Created admin user:", admin.email);

  // Create demo users
  const demoPassword = await bcrypt.hash("Demo@123456", 12);

  const demoUsers = [
    {
      email: "john.doe@example.com",
      name: "John Doe",
      username: "johndoe",
      role: UserRole.USER,
      company: "Acme Corp",
      jobTitle: "Product Manager",
      phone: "+1234567890"
    },
    {
      email: "jane.smith@example.com",
      name: "Jane Smith",
      username: "janesmith",
      role: UserRole.USER,
      company: "Tech Solutions",
      jobTitle: "Software Engineer",
      phone: "+1234567891"
    },
    {
      email: "moderator@example.com",
      name: "Mike Moderator",
      username: "moderator",
      role: UserRole.MODERATOR,
      company: "Verbio AI",
      jobTitle: "Community Manager"
    }
  ];

  for (const userData of demoUsers) {
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: {
        ...userData,
        password: demoPassword,
        status: UserStatus.ACTIVE,
        emailVerified: true,
        emailVerifiedAt: new Date(),
        credits: 100,
        permissions: userData.role === UserRole.MODERATOR
          ? ["users.read", "calls.read", "analytics.read"]
          : []
      }
    });

    console.log("✅ Created demo user:", user.email);

    // Create welcome notification
    await prisma.notification.create({
      data: {
        userId: user.id,
        type: NotificationType.INFO,
        title: "Welcome to Verbio AI!",
        message: "Your account has been created. Start exploring our AI voice calling features!"
      }
    });
  }

  // Create sample saved configurations
  const users = await prisma.user.findMany({
    where: { role: UserRole.USER }
  });

  const sampleConfigs = [
    {
      name: "Customer Support Agent",
      description: "Professional and helpful customer service voice",
      configuration: {
        voice: "alloy",
        instructions: "You are a professional customer support agent. Be helpful, patient, and courteous.",
        temperature: 0.7,
        model: "gpt-4o-realtime-preview",
        turn_detection: {
          type: "server_vad",
          threshold: 0.5,
          silence_duration_ms: 500
        }
      },
      category: "support",
      isTemplate: true,
      isPublic: true
    },
    {
      name: "Sales Assistant",
      description: "Engaging and persuasive sales voice",
      configuration: {
        voice: "echo",
        instructions: "You are a friendly sales assistant. Help customers find the right products and answer questions enthusiastically.",
        temperature: 0.9,
        model: "gpt-4o-realtime-preview",
        turn_detection: {
          type: "semantic_vad",
          eagerness: "high"
        }
      },
      category: "sales",
      isTemplate: true,
      isPublic: true
    },
    {
      name: "Technical Support",
      description: "Technical and precise support voice",
      configuration: {
        voice: "sage",
        instructions: "You are a technical support specialist. Provide clear, accurate technical assistance.",
        temperature: 0.5,
        model: "gpt-4o-realtime-preview",
        turn_detection: {
          type: "server_vad",
          threshold: 0.6,
          silence_duration_ms: 700
        }
      },
      category: "technical",
      isTemplate: true,
      isPublic: true
    }
  ];

  for (const config of sampleConfigs) {
    const savedConfig = await prisma.savedConfiguration.create({
      data: {
        ...config,
        userId: users[0].id,
        tags: [config.category!, "template", "verified"]
      }
    });

    console.log("✅ Created template configuration:", savedConfig.name);
  }

  // Create sample analytics events
  const analyticsEvents = [
    { event: "page.view", properties: { page: "/dashboard" } },
    { event: "feature.used", properties: { feature: "ai_call" } },
    { event: "call.started", properties: { duration: 0 } },
    { event: "call.completed", properties: { duration: 120 } }
  ];

  for (const user of users.slice(0, 2)) {
    for (const event of analyticsEvents) {
      await prisma.analytics.create({
        data: {
          userId: user.id,
          ...event,
          sessionId: `session_${Math.random().toString(36).substring(7)}`,
          timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) // Random time in last 7 days
        }
      });
    }
  }

  console.log("✅ Created sample analytics events");

  // Create system health records
  const services = ["api", "database", "websocket", "ai_service"];

  for (const service of services) {
    await prisma.systemHealth.create({
      data: {
        service,
        status: "healthy",
        uptime: 99.9,
        latency: Math.floor(Math.random() * 50) + 10,
        errorRate: Math.random() * 0.1,
        metadata: {
          version: "1.0.0",
          region: "us-west-1"
        }
      }
    });
  }

  console.log("✅ Created system health records");

  console.log("🎉 Database seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });