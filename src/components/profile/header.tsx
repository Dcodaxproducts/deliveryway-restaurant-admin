"use client";
import { Button } from '@/components/ui/button'
import Header from '../header'
import { useRouter, usePathname } from 'next/navigation'

export default function ProfileHeader({ title, description }: HeaderProps) {
    const router = useRouter()
    const pathname = usePathname() // Get the current pathname

    const isEditPage = pathname === '/profile/edit' // Check if the current page is '/profile/edit'

    return (
        <div className="flex flex-col gap-4 md:gap-6 lg:flex-row lg:items-center lg:justify-between w-full">
            <Header
                title={title}
                description={description}
            />

            <Button
                variant="default"
                className="w-full sm:w-auto whitespace-nowrap"
                onClick={() => router.push(isEditPage ? '/profile' : '/profile/edit')}
            >
                {isEditPage ? 'Save' : 'Edit Profile'} {/* Dynamically change text */}
            </Button>
        </div>
    )
}
