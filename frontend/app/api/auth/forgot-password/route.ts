import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";
import nodemailer from "nodemailer";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return Response.json(
        { message: "Email is required" },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      // Return success even if user doesn't exist to prevent email enumeration
      return Response.json(
        { message: "If an account with this email exists, a reset link has been sent" },
        { status: 200 }
      );
    }

    // Generate a unique password reset token
    const resetToken = randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    // Save the reset token to the database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry,
      }
    });

    // Send reset email (in production, use a proper email service)
    // For now, we'll just log the token - in a real app you'd send an email
    console.log(`Password reset token for ${email}: ${resetToken}`);

    // In a real implementation, you'd send an email with nodemailer or similar:
    /*
    const transporter = nodemailer.createTransporter({
      // Your email configuration
    });

    await transporter.sendMail({
      to: email,
      subject: "Password Reset",
      html: `<p>You requested a password reset. Click <a href="${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}">here</a> to reset your password.</p>`
    });
    */

    return Response.json(
      { message: "If an account with this email exists, a reset link has been sent" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Forgot password error:", error);
    return Response.json(
      { message: "An error occurred during password reset request" },
      { status: 500 }
    );
  }
}