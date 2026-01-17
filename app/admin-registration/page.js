"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminRegistrationRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to admin login since registration is not needed
    router.replace("/admin-login");
  }, [router]);

  return (
    <div style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "100vh",
      flexDirection: "column"
    }}>
      <div>Redirecting...</div>
    </div>
  );
}