import Checkbox from '@/components/Checkbox'
import InputError from '@/components/InputError'
import InputLabel from '@/components/InputLabel'
import PrimaryButton from '@/components/PrimaryButton'
import FloatingInput from '@/components/FloatingInput'
import TextInput from '@/components/TextInput'
import { Head, Link, useForm } from '@inertiajs/react'
import { Loader2, Search } from "lucide-react"
import { TypewriterEffect } from "@/components/TypewriterEffect"
import { Button } from "@/components/ui/button"
import { useRef } from "react"

export default function Login({ status, canResetPassword }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    })

    /* const emailRef = useRef(null)

    const focusEmailInput = () => {
        if (emailRef.current) {
            emailRef.current.focus()
        }
    } */

    const words = [
        { text: "Human", className: "text-[#F7D000]" },
        { text: "Resource", className: "text-[#F7D000]" },
        { text: "Information", className: "text-[#F7D000]" },
        { text: "System", className: "text-[#F7D000]" },
    ]

    const submit = (e) => {
        e.preventDefault()
        post(route('login'), {
            onFinish: () => reset('password'),
        })
    }

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 h-screen">
                <div className="col-span-1 md:col-span-1 lg:col-span-1 flex items-center justify-center h-full">
                    <Head title="Log in" />
                    <div className="flex justify-start w-full max-w-md">
                        <div className="flex flex-col gap-2 w-full p-8">
                        <h3 className="text-2xl font-extrabold text-blue-700">DRO1 HRIS</h3>
                        <p className="text-sm">Use your registered account to sign in.</p>
                        {status && (
                            <div className="text-sm font-medium text-green-600">{status}</div>
                        )}

                        <form onSubmit={submit} className="flex flex-col gap-4 mt-4">
                            <FloatingInput
                            id="email"
                            label="Email"
                            type="email"
                            value={data.email}
                            onChange={(e) => setData("email", e.target.value)}
                            error={errors.email}
                            autoFocus
                            />

                            <FloatingInput
                            id="password"
                            label="Password"
                            type="password"
                            value={data.password}
                            onChange={(e) => setData("password", e.target.value)}
                            error={errors.password}
                            />

                            <div className="mt-2 flex justify-between">
                            <label className="flex items-center">
                                <Checkbox
                                name="remember"
                                checked={data.remember}
                                onChange={(e) => setData('remember', e.target.checked)}
                                />
                                <span className="ml-2 text-sm text-gray-600">Remember me</span>
                            </label>
                            </div>

                            <div className="mt-2 flex flex-col items-center gap-2">
                            <Button
                                className="w-full flex justify-center h-12 uppercase"
                                disabled={processing}
                            >
                                {processing ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    <span>Signing in</span>
                                </>
                                ) : 'Sign in'}
                            </Button>
                            </div>
                        </form>

                        {canResetPassword && (
                            <div className="mt-2">
                            <a
                                href={route('password.request')}
                                className="text-sm text-gray-600 underline hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                            >
                                Forgot your password?
                            </a>
                            </div>
                        )}

                        <div className="flex items-center my-4">
                            <div className="flex-1 h-px bg-gray-200" />
                            <span className="px-3 text-muted-foreground text-sm">OR</span>
                            <div className="flex-1 h-px bg-gray-200" />
                        </div>

                        <Link
                            href="/register"
                            className="underline hover:text-gray-900"
                        >
                            <Button variant="outline" className="w-full h-12 font-semibold bg-blue-700 hover:bg-blue-600 text-white hover:text-white">CREATE AN ACCOUNT</Button>
                        </Link>
                        </div>
                    </div>
                </div>
                <div className="hidden md:flex lg:flex md:col-span-2 lg:col-span-3 flex-col justify-between h-full bg-black bg-muted p-8">
                    {/* Top navigation */}
                    <div className="flex justify-end">
                        <Link
                        href="/"
                        className="flex items-center gap-2 text-base font-semibold text-foreground"
                        >
                        Search Jobs
                        </Link>
                    </div>

                    {/* Center banner */}
                    <div className="flex justify-center flex-1 items-center">
                        <img
                        src="/images/login_banner.png"
                        alt="Banner"
                        className="h-auto max-w-full w-[60%] object-contain"
                        />
                    </div>

                    {/* Bottom copyright */}
                    <div className="flex justify-end">
                        <span className="text-sm text-gray-400">
                        &copy; {new Date().getFullYear()} DEPDev RO1. All rights reserved.
                        </span>
                    </div>
                </div>
            </div>
        </>
    )
}
