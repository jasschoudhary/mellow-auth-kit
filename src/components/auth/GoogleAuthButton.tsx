
import React from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { googleLogin } from "@/services/authService";

const GoogleAuthButton = () => {
  const handleGoogleLogin = () => {
    try {
      googleLogin();
      toast.info("Google login would redirect to Google's OAuth service");
    } catch (error) {
      toast.error("Failed to initiate Google login");
    }
  };

  return (
    <Button 
      type="button" 
      variant="outline" 
      className="w-full" 
      onClick={handleGoogleLogin}
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
        <circle cx="12" cy="12" r="10" />
        <path d="M8 12h8" />
        <path d="M12 8v8" />
      </svg>
      Google
    </Button>
  );
};

export default GoogleAuthButton;
