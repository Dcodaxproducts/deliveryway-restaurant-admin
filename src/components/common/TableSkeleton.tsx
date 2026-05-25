"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Props = {
  headers: string[];
  rows?: number;
  showCheckbox?: boolean;
  showActions?: boolean;
};

export default function TableSkeleton({
  headers,
  rows = 6,
  showCheckbox = false,
  showActions = false,
}: Props) {
  return (
    <div className="hidden lg:block">
      <Table className="animate-pulse">
        {/* HEADER */}
        <TableHeader>
          <TableRow className="border-none bg-gray-50">
            {showCheckbox && (
              <TableHead className="w-[50px]" />
            )}

            {headers.map((header, i) => (
              <TableHead key={i} className="text-gray-600">
                {header}
              </TableHead>
            ))}

            {showActions && (
              <TableHead className="text-center">Actions</TableHead>
            )}
          </TableRow>
        </TableHeader>

        {/* BODY */}
        <TableBody>
          {Array.from({ length: rows }).map((_, i) => (
            <TableRow key={i} className="border-none h-[70px]">
              {showCheckbox && (
                <TableCell>
                  <div className="h-4 w-4 bg-gray-200 rounded" />
                </TableCell>
              )}

              {headers.map((_, j) => (
                <TableCell key={j} className="px-4">
                  <div className="h-4 w-24 bg-gray-200 rounded" />
                </TableCell>
              ))}

              {showActions && (
                <TableCell>
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-8 w-8 bg-gray-200 rounded-md" />
                    <div className="h-8 w-8 bg-gray-200 rounded-md" />
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}