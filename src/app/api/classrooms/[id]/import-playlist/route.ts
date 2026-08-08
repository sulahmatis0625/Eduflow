import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { chunkVideosIntoChapters, type PlaylistVideo } from "@/lib/youtube-playlist";

type ChapterInput = {
  title: string;
  lessons: PlaylistVideo[];
};

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || !["ADMIN", "INSTRUCTOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const userId = session.user.id as string;

    const course = await db.course.findUnique({
      where: { id },
      select: { id: true, instructorId: true },
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    if (session.user.role !== "ADMIN" && course.instructorId !== userId) {
      return NextResponse.json({ error: "You do not own this course" }, { status: 403 });
    }

    const body = await req.json();
    const replaceExisting = body.replaceExisting !== false;

    let chapters: ChapterInput[] = [];

    if (Array.isArray(body.chapters) && body.chapters.length > 0) {
      chapters = body.chapters
        .map((ch: ChapterInput, i: number) => ({
          title: (ch.title || `Chapter ${i + 1}`).trim() || `Chapter ${i + 1}`,
          lessons: Array.isArray(ch.lessons) ? ch.lessons : [],
        }))
        .filter((ch: ChapterInput) => ch.lessons.length > 0);
    } else {
      const videos = (body.videos || []) as PlaylistVideo[];
      if (!Array.isArray(videos) || videos.length === 0) {
        return NextResponse.json({ error: "No videos to import" }, { status: 400 });
      }
      chapters = chunkVideosIntoChapters(videos, 6);
    }

    if (chapters.length === 0) {
      return NextResponse.json({ error: "No lessons to import" }, { status: 400 });
    }

    if (replaceExisting) {
      await db.section.deleteMany({ where: { courseId: id } });
    }

    let totalLessons = 0;
    let totalDuration = 0;
    let firstLesson: PlaylistVideo | null = null;

    for (let ci = 0; ci < chapters.length; ci++) {
      const chapter = chapters[ci];
      const section = await db.section.create({
        data: {
          title: chapter.title,
          order: ci + 1,
          courseId: id,
        },
      });

      for (let li = 0; li < chapter.lessons.length; li++) {
        const lesson = chapter.lessons[li];
        if (!firstLesson) firstLesson = lesson;
        const duration = lesson.durationMinutes || 0;
        await db.lesson.create({
          data: {
            title: lesson.title,
            type: "VIDEO",
            videoUrl: lesson.url,
            duration,
            order: li + 1,
            isFree: ci === 0 && li === 0,
            isPreview: ci === 0 && li === 0,
            sectionId: section.id,
          },
        });
        totalLessons += 1;
        totalDuration += duration;
      }
    }

    const updated = await db.course.update({
      where: { id },
      data: {
        totalLessons,
        duration: totalDuration,
        thumbnail: body.thumbnail || firstLesson?.thumbnail || undefined,
        previewVideo: firstLesson?.url || undefined,
      },
      include: {
        sections: {
          orderBy: { order: "asc" },
          include: {
            lessons: { orderBy: { order: "asc" } },
          },
        },
      },
    });

    return NextResponse.json({
      course: updated,
      imported: totalLessons,
      chapters: chapters.length,
    });
  } catch (error) {
    console.error("Import playlist error:", error);
    return NextResponse.json({ error: "Failed to import playlist" }, { status: 500 });
  }
}
