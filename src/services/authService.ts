
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

// Sign up function
export const signUp = async (name: string, email: string, password: string) => {
  try {
    // Check if user already exists
    const response = await fetch('/api/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, email, password }),
    });

    if (response.status === 409) {
      // User already exists
      const data = await response.json();
      throw new Error(data.error);
    }

    if (!response.ok) {
      // Generic error
      const data = await response.json();
      throw new Error(data.error || 'Failed to sign up');
    }

    return await response.json();
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

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Invalid credentials');
    }

    const result = await response.json();
    
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

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        throw new Error('Server error: ' + errorText);
      }
      throw new Error(errorData.error || 'Failed to send reset email');
    }

    const data = await response.json();
    
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

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to reset password');
    }

    return await response.json();
  } catch (error) {
    console.error('Reset password error:', error);
    throw error;
  }
};

// Google login function
export const googleLogin = () => {
  window.location.href = '/auth/google';
};
