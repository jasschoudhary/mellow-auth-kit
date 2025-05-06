
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

// Get the API base URL based on the environment
const getApiBaseUrl = () => {
  // Check if we're running on localhost or in development
  if (window.location.hostname === 'localhost' || window.location.hostname.includes('lovableproject.com')) {
    // For local development or Lovable preview, use port 5000
    return 'http://localhost:5000';
  }
  // For production, use the same origin
  return '';
};

// Helper function to handle API responses safely
const handleApiResponse = async (response: Response) => {
  if (!response.ok) {
    // Try to parse error as JSON first
    try {
      const errorText = await response.text();
      try {
        // Try to parse as JSON
        const errorData = JSON.parse(errorText);
        throw new Error(errorData.error || `Error: ${response.status} ${response.statusText}`);
      } catch (jsonError) {
        // If JSON parsing fails, use text
        if (errorText) {
          throw new Error(`Error: ${errorText}`);
        } else {
          throw new Error(`Error: ${response.status} ${response.statusText}`);
        }
      }
    } catch (e) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }
  }

  // For successful responses, parse the JSON
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
  const apiBaseUrl = getApiBaseUrl();
  try {
    console.log("Sending signup request to:", `${apiBaseUrl}/api/signup`);
    console.log("Signup data:", { name, email, password: "***" });
    
    const response = await fetch(`${apiBaseUrl}/api/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, email, password }),
    });

    console.log("Signup response status:", response.status);
    
    const result = await handleApiResponse(response);
    console.log("Signup response result:", result);
    return result;
  } catch (error) {
    console.error('Sign up error:', error);
    throw error;
  }
};

// Login function
export const login = async (email: string, password: string) => {
  const apiBaseUrl = getApiBaseUrl();
  try {
    const response = await fetch(`${apiBaseUrl}/api/login`, {
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
  const apiBaseUrl = getApiBaseUrl();
  try {
    const response = await fetch(`${apiBaseUrl}/api/forgot-password`, {
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
  const apiBaseUrl = getApiBaseUrl();
  try {
    const response = await fetch(`${apiBaseUrl}/api/reset-password`, {
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
  const apiBaseUrl = getApiBaseUrl();
  // Direct to the Google OAuth endpoint
  window.location.href = `${apiBaseUrl}/auth/google`;
};
