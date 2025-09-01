import { usePage } from '@inertiajs/react'
import AuthenticatedLayout from "@/layouts/AuthenticatedLayout"
import LoginLayout from "@/layouts/LoginLayout"
import GuestLayout from "@/layouts/GuestLayout"
import { TextSizeProvider } from "@/providers/TextSizeProvider"
import { UserProvider } from "@/providers/UserProvider"
import { TooltipProvider } from "@/components/ui/tooltip"
import { User } from 'lucide-react'

const DefaultLayout = ({ children }) => {
    
    const { props, url } = usePage()
    const user = props.auth?.user

    // Render LoginLayout if the current URL is /login
    if (url === '/login') {
        return (
            <LoginLayout>
                {children}
            </LoginLayout>
        )
    }

    // Render AuthenticatedLayout if the user is authenticated
    if (user) {
        return (
            <TooltipProvider>
                <TextSizeProvider>
                    <UserProvider>
                        <AuthenticatedLayout>
                            {children}
                        </AuthenticatedLayout>
                    </UserProvider>
                </TextSizeProvider>
            </TooltipProvider>
        )
    }

    // Render GuestLayout for other unauthenticated pages
    return (
        <TextSizeProvider>
            <GuestLayout>
                {children}
            </GuestLayout>
        </TextSizeProvider>
    )
}

export default DefaultLayout
