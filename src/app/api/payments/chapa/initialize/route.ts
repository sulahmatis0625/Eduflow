import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized. Please log in first." }, { status: 401 });
    }

    const { courseId, paymentMethod = "telebirr", preferRealGateway = false } = await req.json();

    const course = await db.course.findUnique({
      where: { id: courseId },
      include: { instructor: { select: { id: true, name: true } } },
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Check if already enrolled
    const existingEnrollment = await db.enrollment.findUnique({
      where: { userId_courseId: { userId: session.user.id, courseId } },
    });

    if (existingEnrollment) {
      return NextResponse.json({ error: "You are already enrolled in this course." }, { status: 409 });
    }

    const amount = course.discountPrice || course.price;
    const currency = course.currency || "ETB";
    const txRef = `ED-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

    const chapaSecretKey = process.env.CHAPA_SECRET_KEY?.trim();

    // Mode 1: Real Chapa Hosted Gateway
    if (preferRealGateway) {
      if (!chapaSecretKey || !chapaSecretKey.startsWith("CHASECK") || chapaSecretKey.includes("your-test-key-here")) {
        return NextResponse.json(
          {
            error: "CHAPA_SECRET_KEY is not configured in your .env file yet. Add your key from chapa.co to use the real hosted checkout, or switch to Dev Mode for instant simulated payment.",
          },
          { status: 400 }
        );
      }

      const origin = req.nextUrl.origin || "http://localhost:3000";

      const chapaRes = await fetch("https://api.chapa.co/v1/transaction/initialize", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${chapaSecretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: String(amount),
          currency,
          email: session.user.email || "student@eduflow.com",
          first_name: session.user.name?.split(" ")[0] || "Student",
          last_name: session.user.name?.split(" ")[1] || "Learner",
          tx_ref: txRef,
          callback_url: `${origin}/api/payments/chapa/verify?tx_ref=${txRef}`,
          return_url: `${origin}/dashboard/courses?payment=success&tx_ref=${txRef}&courseId=${courseId}`,
          "customization[title]": "EduFlow Learning",
          "customization[description]": `Enrollment for ${course.title}`,
        }),
      });

      const chapaData = await chapaRes.json();

      if (chapaRes.ok && chapaData.data?.checkout_url) {
        // Record pending payment in DB
        await db.payment.create({
          data: {
            userId: session.user.id,
            courseId,
            amount,
            currency,
            status: "PENDING",
            method: `CHAPA (${paymentMethod.toUpperCase()})`,
            transactionId: txRef,
          },
        });

        return NextResponse.json({
          checkoutUrl: chapaData.data.checkout_url,
          txRef,
          mode: "chapa_hosted",
        });
      } else {
        return NextResponse.json(
          { error: chapaData.message || "Failed to initialize payment with Chapa API" },
          { status: 502 }
        );
      }
    }

    // Mode 2: Dev Mode (Instant In-App Simulation)
    const methodLabel =
      paymentMethod === "cbe"
        ? "CHAPA (CBE Birr)"
        : paymentMethod === "card"
        ? "CHAPA (Card)"
        : "CHAPA (Telebirr)";

    const payment = await db.payment.create({
      data: {
        userId: session.user.id,
        courseId,
        amount,
        currency,
        status: "COMPLETED",
        method: methodLabel,
        transactionId: txRef,
      },
    });

    // Automatically enroll student
    await db.enrollment.upsert({
      where: { userId_courseId: { userId: session.user.id, courseId } },
      update: { status: "ACTIVE", approvedAt: new Date() },
      create: {
        userId: session.user.id,
        courseId,
        status: "ACTIVE",
        approvedAt: new Date(),
      },
    });

    // Award XP
    await db.user.update({
      where: { id: session.user.id },
      data: { xp: { increment: 25 } },
    });

    // Send student notification
    await db.notification.create({
      data: {
        userId: session.user.id,
        title: "Payment Successful!",
        message: `Successfully purchased "${course.title}" for ${amount} ${currency} via ${methodLabel}.`,
        type: "PAYMENT",
        link: `/learn/${courseId}`,
      },
    });

    return NextResponse.json({
      success: true,
      redirectUrl: `/dashboard/courses?payment=success&courseId=${courseId}`,
      mode: "test_simulated",
      payment,
    });
  } catch (error) {
    console.error("Chapa initialize error:", error);
    return NextResponse.json(
      { error: "Failed to initialize payment" },
      { status: 500 }
    );
  }
}
