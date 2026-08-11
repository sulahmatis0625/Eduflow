import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { saveAvatarDataUrl } from "@/lib/save-avatar";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        bio: true,
        role: true,
        xp: true,
        level: true,
        createdAt: true,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("Profile fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, bio, image } = body;
    const userId = session.user.id as string;
    const role = session.user.role;

    let imageValue: string | undefined | null = undefined;
    if (image !== undefined) {
      if (!image || (typeof image === "string" && !image.trim())) {
        imageValue = null;
      } else if (typeof image === "string" && image.startsWith("data:image/")) {
        try {
          imageValue = await saveAvatarDataUrl(userId, image);
        } catch (err) {
          return NextResponse.json(
            {
              error:
                err instanceof Error
                  ? err.message
                  : "Could not save profile photo",
            },
            { status: 400 }
          );
        }
      } else if (typeof image === "string") {
        // Already a public URL / path
        imageValue = image.trim();
      }
    }

    if (
      (role === "INSTRUCTOR" || role === "ADMIN") &&
      image !== undefined &&
      !imageValue
    ) {
      return NextResponse.json(
        { error: "Instructors must upload a profile photo." },
        { status: 400 }
      );
    }

    const user = await db.user.update({
      where: { id: userId },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(bio !== undefined ? { bio } : {}),
        ...(imageValue !== undefined ? { image: imageValue } : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        bio: true,
        role: true,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
