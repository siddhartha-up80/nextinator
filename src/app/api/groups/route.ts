import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/db/prisma";
import { z } from "zod";

export const dynamic = "force-dynamic";

const createGroupSchema = z.object({
  name: z.string().min(1, { message: "Group name is required" }),
  color: z.string().optional(),
});

const updateGroupSchema = createGroupSchema.extend({
  id: z.string().min(1),
});

const deleteGroupSchema = z.object({
  id: z.string().min(1),
});

// GET - Get all groups for the user
export async function GET(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const groups = await prisma.group.findMany({
      where: { userId },
      include: {
        _count: {
          select: { notes: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return Response.json({ groups }, { status: 200 });
  } catch (error) {
    console.error("Error fetching groups:", error);
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// POST - Create a new group
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parseResult = createGroupSchema.safeParse(body);

    if (!parseResult.success) {
      console.error(parseResult.error);
      return Response.json({ error: "Invalid input" }, { status: 400 });
    }

    const { name, color } = parseResult.data;
    const { userId } = await auth();

    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if group with this name already exists for the user
    const existingGroup = await prisma.group.findFirst({
      where: { userId, name },
    });

    if (existingGroup) {
      return Response.json(
        { error: "Group with this name already exists" },
        { status: 400 }
      );
    }

    const group = await prisma.group.create({
      data: {
        name,
        color: color || "#6366f1",
        userId,
      },
      include: {
        _count: {
          select: { notes: true },
        },
      },
    });

    return Response.json({ group }, { status: 201 });
  } catch (error) {
    console.error("Error creating group:", error);
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// PUT - Update a group
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const parseResult = updateGroupSchema.safeParse(body);

    if (!parseResult.success) {
      console.error(parseResult.error);
      return Response.json({ error: "Invalid input" }, { status: 400 });
    }

    const { id, name, color } = parseResult.data;
    const { userId } = await auth();

    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const group = await prisma.group.findUnique({ where: { id } });

    if (!group) {
      return Response.json({ error: "Group not found" }, { status: 404 });
    }

    if (group.userId !== userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if another group with this name already exists for the user
    const existingGroup = await prisma.group.findFirst({
      where: {
        userId,
        name,
        id: { not: id },
      },
    });

    if (existingGroup) {
      return Response.json(
        { error: "Group with this name already exists" },
        { status: 400 }
      );
    }

    const updatedGroup = await prisma.group.update({
      where: { id },
      data: {
        name,
        color: color || group.color,
      },
      include: {
        _count: {
          select: { notes: true },
        },
      },
    });

    return Response.json({ group: updatedGroup }, { status: 200 });
  } catch (error) {
    console.error("Error updating group:", error);
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// DELETE - Delete a group
export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const parseResult = deleteGroupSchema.safeParse(body);

    if (!parseResult.success) {
      console.error(parseResult.error);
      return Response.json({ error: "Invalid input" }, { status: 400 });
    }

    const { id } = parseResult.data;
    const { userId } = await auth();

    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const group = await prisma.group.findUnique({ where: { id } });

    if (!group) {
      return Response.json({ error: "Group not found" }, { status: 404 });
    }

    if (group.userId !== userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Delete the group (notes will be set to null due to SetNull cascade)
    await prisma.group.delete({
      where: { id },
    });

    return Response.json(
      { message: "Group deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting group:", error);
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
}
