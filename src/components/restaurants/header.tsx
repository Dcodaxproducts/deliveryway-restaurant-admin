"use client"

import { HelpCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Header from '../header'
import { useRouter } from 'next/navigation'

export default function RestaurantsHeader({ title, description }: HeaderProps) {
    const router = useRouter()
    return (
        <div className="flex flex-col gap-4 md:gap-6 lg:flex-row lg:items-center lg:justify-between w-full">
            <Header
                title={title}
                description={description}
            />

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-3 lg:gap-4">
                <Button
                    variant="outline"
                    className="w-full sm:w-auto justify-between sm:justify-start"
                >
                    <p className='pt-1'>View Trash</p>
                    <HelpCircle size={18} className="text-gray/60" />
                </Button>

                <Button
                    variant="outline"
                    className="w-full sm:w-auto justify-between sm:justify-start"
                >
                    <p className='pt-1'>View Drafts</p>
                    <HelpCircle size={18} className="text-gray/60" />
                </Button>

                <Button
                    variant="default"
                    onClick={() => router.push('/restaurants/add')}
                    className="w-full sm:w-auto whitespace-nowrap"
                >
                    Add New Restaurant
                </Button>
            </div>
        </div>
    )
}