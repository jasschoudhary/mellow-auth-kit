
import { toast } from "sonner";

// Types for user data
interface User {
  email: string;
  passwordHash: string;
  resetToken?: string;
  resetTokenExpiry?: Date;
}

// For development purposes, you can see the current users in the console
const logUsers = () => {
  console.log("Current users:", fetch('/api/users').then(res => res.json()));
};

// Helper function to handle API responses safely
const handleApiResponse = async (response: Response) => {
  if (!response.ok) {
    // Try to parse error as JSON first
    try {
      const errorData = await response.json();
      throw new Error(errorData.error || `Error: ${response.status} ${response.statusText}`);
    } catch (e) {
      // If JSON parsing fails, use text or status
      const errorText = await response.text();
      if (errorText) {
        throw new Error(`Error: ${errorText}`);
      } else {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }
    }
  }

  // For successful responses, handle empty responses gracefully
  try {
    const text = await response.text();
    return text ? JSON.parse(text) : { success: true };
  } catch (e) {
    console.error('Response parsing error:', e);
    return { success: true };
  }
};

// Sign up function
export const signUp = async (name: string, email: string, password: string) => {
  try {
    console.log("Sending signup request:", { name, email, password: "***" });
    const response = await fetch('/api/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, email, password }),
    });

    const result = await handleApiResponse(response);
    console.log("Signup response:", result);
    return result;
  } catch (error) {
    console.error('Sign up error:', error);
    throw error;
  }
};

// Login function
export const login = async (email: string, password: string) => {
  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const result = await handleApiResponse(response);
    
    // Store token in localStorage for future requests
    if (result.token) {
      localStorage.setItem('authToken', result.token);
    }
    
    return result;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

// Forgot password function
export const forgotPassword = async (email: string) => {
  try {
    const response = await fetch('/api/forgot-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    const data = await handleApiResponse(response);
    
    // Show confirmation banner
    toast.success(data.message || "Reset email sent");
    
    return data;
  } catch (error) {
    console.error('Forgot password error:', error);
    throw error;
  }
};

// Reset password function
export const resetPassword = async (token: string, password: string) => {
  try {
    const response = await fetch('/api/reset-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token, password }),
    });

    return await handleApiResponse(response);
  } catch (error) {
    console.error('Reset password error:', error);
    throw error;
  }
};

// Google login function
export const googleLogin = () => {
  // Direct to the Google OAuth endpoint
  window.location.href = '/auth/google';
};
