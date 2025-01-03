import { usePage } from '@inertiajs/react'
import AuthenticatedLayout from "@/layouts/AuthenticatedLayout"
import GuestLayout from "@/layouts/GuestLayout"
import { TextSizeProvider } from "@/providers/TextSizeProvider"
import { UserProvider } from "@/providers/UserProvider"
import { User } from 'lucide-react'

const DefaultLayout = ({ children }) => {
    
    const user = usePage().props.auth.user

    return (
        <TextSizeProvider>
        {user ? (
            <UserProvider>
                <AuthenticatedLayout>{children}</AuthenticatedLayout>
            </UserProvider>
        ) : (
            <GuestLayout>{children}</GuestLayout>
        )}
        </TextSizeProvider>
    )
}

export default DefaultLayout
