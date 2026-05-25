import { Suspense } from "react";
import CategoryDetailsPage from "@/components/pages/Menu/CategoryDetails";

const page = () => {
  return (
    <Suspense fallback={<CategoryDetailsPageSkeleton />}>
      <CategoryDetailsPage />
    </Suspense>
  );
};

export default page;

function CategoryDetailsPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-3">
          <div className="h-8 w-[240px] animate-pulse rounded bg-gray-200" />
          <div className="h-4 w-[340px] animate-pulse rounded bg-gray-100" />
        </div>
        <div className="h-11 w-[100px] animate-pulse rounded-[14px] bg-gray-200" />
      </div>

      <div className="overflow-hidden rounded-[24px] bg-white shadow-sm">
        <div className="h-[280px] animate-pulse bg-gray-200" />

        <div className="grid gap-4 p-6 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="rounded-[18px] border border-gray-100 bg-[#F9FAFB] p-5"
            >
              <div className="mb-4 h-10 w-10 animate-pulse rounded-[12px] bg-gray-200" />
              <div className="h-7 w-16 animate-pulse rounded bg-gray-200" />
              <div className="mt-3 h-4 w-24 animate-pulse rounded bg-gray-100" />
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr,1.4fr]">
        {Array.from({ length: 2 }).map((_, index) => (
          <div key={index} className="rounded-[20px] bg-white p-6 shadow-sm">
            <div className="h-6 w-40 animate-pulse rounded bg-gray-200" />

            <div className="mt-6 space-y-4">
              {Array.from({ length: 5 }).map((_, rowIndex) => (
                <div
                  key={rowIndex}
                  className="h-16 animate-pulse rounded-[14px] bg-gray-100"
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}