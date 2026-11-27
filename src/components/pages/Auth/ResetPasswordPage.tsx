import { LocalizedText } from "@/components/common/LocalizedText";
import { Suspense } from "react";

import ResetPasswordForm from "@/components/pages/Auth/ResetPasswordForm";

export default function ResetPasswordPage() {
  return (
    <div>
      <Suspense fallback={<div className="py-10 text-center"><LocalizedText messageKey="message184" /></div>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
