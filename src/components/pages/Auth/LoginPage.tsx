import { Suspense } from "react";

import LoginForm from "@/components/pages/Auth/LoginForm";

export default function LoginPage() {
  return (
    <div>
      <Suspense fallback={<div className="py-10 text-center">Loading login...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
