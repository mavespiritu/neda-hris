import { Button } from "@/components/ui/button"
import { Link } from '@inertiajs/react'
import { Menu } from 'lucide-react'
import { useState } from "react"

const GuestHeader = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    return (
        <header className="h-[80px] border-b flex justify-between items-center px-4 md:px-8 lg:px-16 xl:px-32">
            {/* Logo */}
            <div className="flex items-center">
                <Link href="/" className="font-bold text-xl">NEDA RO1 HRIS</Link>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex gap-6 items-center font-medium">
                <Link href="/jobs" className="hover:text-gray-800">Search Jobs</Link>
                <Link href="/register" className="hover:text-gray-800">Create an Account</Link>
                <Link href="/login">
                    <Button>Sign in</Button>
                </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden"
            >
                <Menu className="w-6 h-6" />
            </button>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <div className="absolute top-[80px] left-0 w-full bg-white shadow-md flex flex-col items-center gap-4 p-6 z-50">
                    <Link href="/jobs" className="hover:text-gray-800" onClick={() => setIsMobileMenuOpen(false)}>Search Jobs</Link>
                    <Link href="/register" className="hover:text-gray-800" onClick={() => setIsMobileMenuOpen(false)}>Create an Account</Link>
                    <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                        <Button className="w-full justify-center">Sign in</Button>
                    </Link>
                </div>
            )}
        </header>
    )
}

export default GuestHeader
