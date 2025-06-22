import prisma from "./src/lib/db/prisma";

async function migrateNotes() {
  console.log("🚀 Starting migration of notes without groupId...");

  try {
    // First, let's see how many notes exist without groupId
    const totalNotes = await prisma.note.count();
    console.log(`📊 Total notes in database: ${totalNotes}`);

    // Count notes with null groupId
    const notesWithNullGroupId = await prisma.note.count({
      where: { groupId: null },
    });
    console.log(`📊 Notes with null groupId: ${notesWithNullGroupId}`);

    // Count notes with undefined/missing groupId
    // In MongoDB, we need to check for notes where the field doesn't exist
    const notesWithMissingGroupId = await prisma.note.count({
      where: {
        NOT: {
          groupId: { not: null },
        },
      },
    });
    console.log(
      `📊 Notes with missing/undefined groupId field: ${notesWithMissingGroupId}`
    );

    // Get all notes to inspect them
    const allNotes = await prisma.note.findMany({
      select: {
        id: true,
        title: true,
        groupId: true,
        userId: true,
      },
    });

    console.log("📋 Sample of notes:");
    allNotes.slice(0, 5).forEach((note) => {
      console.log(
        `  - ${note.title}: groupId = ${
          note.groupId
        } (type: ${typeof note.groupId})`
      );
    });

    // Update all notes that don't have a groupId to explicitly set it to null
    console.log("🔄 Updating notes without groupId...");

    // For MongoDB with Prisma, we need to be careful about how we handle this
    // Let's update notes where groupId is undefined (doesn't exist)
    const updateResult = await prisma.note.updateMany({
      where: {
        groupId: undefined,
      },
      data: {
        groupId: null,
      },
    });

    console.log(
      `✅ Updated ${updateResult.count} notes to have explicit null groupId`
    );

    // Verify the changes
    const finalNotesWithNullGroupId = await prisma.note.count({
      where: { groupId: null },
    });
    console.log(
      `📊 Final count of notes with null groupId: ${finalNotesWithNullGroupId}`
    );
  } catch (error) {
    console.error("❌ Migration failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
migrateNotes();
