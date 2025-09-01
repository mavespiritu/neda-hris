import Checkbox from '@/components/Checkbox'
import InputError from '@/components/InputError'
import InputLabel from '@/components/InputLabel'
import PrimaryButton from '@/components/PrimaryButton'
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
            <div className="block lg:hidden absolute top-4 right-4">
                <Link
                    href="/jobs"
                    className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
                >
                    <Search className="w-4 h-4" />
                    Search Jobs
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 h-screen">
                <div className="col-span-2 hidden lg:flex flex-col items-center justify-center h-full bg-black">
                    <p className="text-neutral-200 text-base mb-6 flex flex-col items-center">
                        <span>Department of Planning, Economy, and Development</span>
                        <span>Regional Office 1</span>
                    </p>
                    <TypewriterEffect words={words} />
                    <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 mt-10">
                        <Button 
                            className="border-2 border-white" 
                            size="lg" 
                            //onClick={focusEmailInput}
                        >
                            <Link href="/jobs">Search Jobs</Link>
                        </Button>
                        <Button variant="outline" size="lg" asChild>
                            <Link href="/register">Create an Account</Link>
                        </Button>
                    </div>
                </div>

                <div className="col-span-1 h-full gap-2">
                    <Head title="Log in" />
                    <div className="flex justify-center items-center h-full">
                        <div className="flex flex-col gap-2 lg:w-1/2">
                            <h3 className="text-lg font-semibold text-center">Welcome to DRO1 HRIS</h3>
                            <p className="text-sm text-center">Use your registered account to sign in.</p>
                            {status && (
                                <div className="text-sm font-medium text-green-600">{status}</div>
                            )}

                            <form onSubmit={submit} className="flex flex-col gap-4 mt-4">
                                <div>
                                    <InputLabel htmlFor="email" value="Email" />
                                    <TextInput
                                        id="email"
                                        type="email"
                                        name="email"
                                        value={data.email}
                                        className="mt-1 block w-full"
                                        autoComplete="username"
                                        isFocused={true}
                                        onChange={(e) => setData('email', e.target.value)}
                                        isInvalid={!!errors?.email}
                                        //ref={emailRef}
                                    />
                                    <InputError message={errors.email} className="mt-2 text-red-500" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="password" value="Password" />
                                    <TextInput
                                        id="password"
                                        type="password"
                                        name="password"
                                        value={data.password}
                                        className="mt-1 block w-full"
                                        autoComplete="current-password"
                                        onChange={(e) => setData('password', e.target.value)}
                                        isInvalid={!!errors?.password}
                                    />
                                    <InputError message={errors.password} className="mt-2 text-red-500" />
                                </div>

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
                                    <PrimaryButton className="w-full flex justify-center" disabled={processing}>
                                        {processing ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                <span>Signing in</span>
                                            </>
                                        ) : 'Sign in'}
                                    </PrimaryButton>
                                </div>
                            </form>

                            <div className="mt-4 text-center text-sm text-gray-600">
                                Don’t have an account?{' '}
                                <Link
                                    href="/register"
                                    className="underline hover:text-gray-900"
                                >
                                    Create one
                                </Link>
                            </div>

                            {canResetPassword && (
                                <div className="mt-2 text-center">
                                    <a
                                        href="https://nro1-api.neda.gov.ph/forgot-password"
                                        className="text-sm text-gray-600 underline hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                                    >
                                        Forgot your password?
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}
