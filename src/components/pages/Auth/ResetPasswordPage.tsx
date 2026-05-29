import { Suspense } from "react";

import ResetPasswordForm from "@/components/pages/Auth/ResetPasswordForm";

export default function ResetPasswordPage() {
  return (
    <div>
      <Suspense fallback={<div className="py-10 text-center">Loading reset password...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
