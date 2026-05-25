import Login from "@/components/login/Login";
import { Suspense } from "react";

const page = () => {
  return (
    <div>
      <Suspense fallback={<div className="py-10 text-center">Loading login...</div>}>
        <Login />
      </Suspense>
    </div>
  );
};

export default page;