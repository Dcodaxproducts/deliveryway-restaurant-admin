"use client";

import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import Image from "next/image";
import ActionButtons from "@/components/common/action-buttons"
import Header from "@/components/ui/tableHeader";
import StatusBadge from "@/components/common/legacy-status-badge";

const restaurants = Array.from({ length: 10 }).map((_, i) => ({
    id: i + 1,
    name: "Dragon Wok",
    model: "Commission",
    domain: "dragonwok.restaurantos.com",
    date: "2024-12-15 10:30",
    status: i % 2 === 0 ? "Active" : "Disabled",
}));


export default function RestaurantTable() {
    return (
        <Table className="border-separate border-spacing-y-[32px] -mt-[32px] px-2 lg:px-0">
            <TableHeader>
                <TableRow className="border-none hover:bg-transparent">
                    <TableHead className="w-[34px]">
                        <Checkbox className="w-[20px] h-[20px] border-gray-300 data-[state=checked]:bg-primary" />
                    </TableHead>
                    <Header label="SL" />
                    <Header label="Restaurant Name" />
                    <Header label="Business Model" />
                    <Header label="Domain" className="text-center" />
                    <Header label="Created Date" />
                    <Header label="Status" />
                    <TableHead className="text-right font-medium">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {restaurants.map((item) => (
                    <TableRow key={item.id} className="border-none hover:bg-gray-50/50">
                        <TableCell>
                            <Checkbox className="w-[20px] h-[20px] border-gray-300 data-[state=checked]:bg-primary" />
                        </TableCell>
                        <TableCell className="text-gray">{item.id}</TableCell>
                        <TableCell>
                            <div className="flex items-center gap-3">
                                <div className="w-[42px] h-[42px] rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                                    <Image
                                        src="/table-pic.png"
                                        alt="logo"
                                        width={256}
                                        height={256}
                                        className="w-[42px] h-[42px] object-contain"
                                    />
                                </div>
                                <span className="text-gray">{item.name}</span>
                            </div>
                        </TableCell>
                        <TableCell className="text-gray">{item.model}</TableCell>
                        <TableCell className="text-gray text-sm">{item.domain}</TableCell>
                        <TableCell className="text-gray text-sm">{item.date}</TableCell>
                        <TableCell>
                            <StatusBadge status={item.status} />
                        </TableCell>
                        <TableCell className="text-right">
                            <ActionButtons />
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}
