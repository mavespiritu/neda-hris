import { usePage } from '@inertiajs/react'
import AuthenticatedLayout from "@/layouts/AuthenticatedLayout"
import GuestLayout from "@/layouts/GuestLayout"
import { TextSizeProvider } from "@/providers/TextSizeProvider"
import { UserProvider } from "@/providers/UserProvider"
import { CsrfProvider } from "@/providers/CsrfProvider"
import { User } from 'lucide-react'

const DefaultLayout = ({ children }) => {
    
    const user = usePage().props.auth.user

    console.log(user)

    return (
        <CsrfProvider>
        <TextSizeProvider>
        {user ? (
            <UserProvider>
                <AuthenticatedLayout>{children}</AuthenticatedLayout>
            </UserProvider>
        ) : (
            <GuestLayout>{children}</GuestLayout>
        )}
        </TextSizeProvider>
        </CsrfProvider>
    )
}

export default DefaultLayout
