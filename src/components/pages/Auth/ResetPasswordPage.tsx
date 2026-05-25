import { Suspense } from "react";
import ResetPassword from "@/components/pages/Auth/ResetPassword";

const page = () => {
  return (
    <div>
      <Suspense fallback={<div className="py-10 text-center">Loading subcategories...</div>}>
        <ResetPassword />
      </Suspense>
    </div>
  );
};

export default page;