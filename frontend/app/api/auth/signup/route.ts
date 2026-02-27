import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcrypt";
import { prisma } from "../../../../lib/prisma";

interface SignupRequest {
  name: string;
  email: string;
  password: string;
}

interface ApiResponse {
  success: boolean;
  message?: string;
  data?: any;
}

export async function POST(request: NextRequest) {
  try {
    const requestData: SignupRequest = await request.json();

    // Validate input
    if (!requestData.name || !requestData.email || !requestData.password) {
      const errorResponse: ApiResponse = {
        success: false,
        message: "Missing required fields"
      };
      
      return new Response(
        JSON.stringify(errorResponse),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: requestData.email },
    });

    if (existingUser) {
      const errorResponse: ApiResponse = {
        success: false,
        message: "User with this email already exists"
      };
      
      return new Response(
        JSON.stringify(errorResponse),
        { status: 409, headers: { "Content-Type": "application/json" } }
      );
    }

    // Hash the password
    const hashedPassword = await hash(requestData.password, 10);

    // Create the user
    const user = await prisma.user.create({
      data: {
        name: requestData.name,
        email: requestData.email,
        password: hashedPassword,
        role: "user", // Default role (matches schema default)
        onboardingCompleted: false,
        onboardingStep: 0,
      },
    });

    // Return success response without password
    const { password: _, ...userWithoutPassword } = user;
    
    const successResponse: ApiResponse = {
      success: true,
      message: "User created successfully",
      data: userWithoutPassword
    };
    
    return new Response(
      JSON.stringify(successResponse),
      { status: 201, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error creating user:", error);
    console.error("Error stack:", error instanceof Error ? error.stack : "Unknown error");
    
    const errorResponse: ApiResponse = {
      success: false,
      message: error instanceof Error ? error.message : "Internal server error"
    };
    
    return new Response(
      JSON.stringify(errorResponse),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}