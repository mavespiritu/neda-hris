import InputError from '@/components/InputError'
import InputLabel from '@/components/InputLabel'
import PrimaryButton from '@/components/PrimaryButton'
import { Button } from '@/components/ui/button'
import TextInput from '@/components/TextInput'
import GuestLayout from '@/layouts/GuestLayout'
import Checkbox from '@/components/Checkbox'
import { Head, Link, useForm } from '@inertiajs/react'
import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

export default function Register() {
    const [showPassword, setShowPassword] = useState(false)
    const [showPasswordConfirm, setShowPasswordConfirm] = useState(false)
    const [passwordFocused, setPasswordFocused] = useState(false)
    const [confirmFocused, setConfirmFocused] = useState(false)

    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        agree: false,
    })

    const submit = (e) => {
        e.preventDefault()

        post(route("register"), {
            onFinish: () => reset("password", "password_confirmation"),
        })
    }

    return (
        <>
            <Head title="Register" />

            <div className="flex flex-col items-center justify-center w-full py-8">
                <h3 className="text-xl font-semibold mb-2">Create an Account</h3>
                <p className="text-sm text-gray-600 mb-6 text-center max-w-md">
                    Sign up to apply for available positions and track your applications.
                </p>

                <form onSubmit={submit} className="w-full max-w-md flex flex-col gap-4">
                    <div>
                        <InputLabel htmlFor="name" value="Name" />
                        <TextInput
                            id="name"
                            name="name"
                            value={data.name}
                            className="mt-1 block w-full"
                            autoComplete="name"
                            isFocused={true}
                            isInvalid={errors.name}
                            onChange={(e) => setData('name', e.target.value)}
                            required
                        />
                        <InputError message={errors.name} className="mt-2" />
                    </div>

                    <div>
                        <InputLabel htmlFor="email" value="Email" />
                        <TextInput
                            id="email"
                            type="email"
                            name="email"
                            value={data.email}
                            className="mt-1 block w-full"
                            autoComplete="username"
                            isInvalid={errors.email}
                            onChange={(e) => setData('email', e.target.value)}
                            required
                        />
                        <InputError message={errors.email} className="mt-2" />
                    </div>

                    {/* Password */}
                    <div className="relative group">
                        <InputLabel htmlFor="password" value="Password" />
                        <div className="relative">
                            <TextInput
                                id="password"
                                type={showPassword ? "text" : "password"}
                                name="password"
                                value={data.password}
                                className="mt-1 block w-full pr-10"
                                autoComplete="new-password"
                                isInvalid={errors.password}
                                onFocus={() => setPasswordFocused(true)}
                                onBlur={() => setPasswordFocused(false)}
                                onChange={(e) => setData('password', e.target.value)}
                                required
                            />
                            {(data.password || passwordFocused) && (
                                <div
                                    className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword
                                        ? <EyeOff className="h-4 w-4 text-gray-500" />
                                        : <Eye className="h-4 w-4 text-gray-500" />}
                                </div>
                            )}
                        </div>
                        <InputError message={errors.password} className="mt-2" />
                    </div>

                    {/* Confirm Password */}
                    <div className="relative group">
                        <InputLabel htmlFor="password_confirmation" value="Confirm Password" />
                        <div className="relative">
                            <TextInput
                                id="password_confirmation"
                                type={showPasswordConfirm ? "text" : "password"}
                                name="password_confirmation"
                                value={data.password_confirmation}
                                className="mt-1 block w-full pr-10"
                                autoComplete="new-password"
                                isInvalid={errors.password_confirmation}
                                onFocus={() => setConfirmFocused(true)}
                                onBlur={() => setConfirmFocused(false)}
                                onChange={(e) => setData('password_confirmation', e.target.value)}
                                required
                            />
                            {(data.password_confirmation || confirmFocused) && (
                                <div
                                    className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer"
                                    onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                                >
                                    {showPasswordConfirm
                                        ? <EyeOff className="h-4 w-4 text-gray-500" />
                                        : <Eye className="h-4 w-4 text-gray-500" />}
                                </div>
                            )}
                        </div>
                        <InputError message={errors.password_confirmation} className="mt-2" />
                    </div>


                    <div className="flex items-start gap-2 mt-2">
                        <Checkbox
                            name="agree"
                            checked={data.agree}
                            onChange={(e) => setData('agree', e.target.checked)}
                        />
                        <label className="text-sm text-gray-600">
                            By signing up, I confirm that I have read and agree to the&nbsp;
                            <a
                                href="https://careers.depdev.gov.ph/static/files/Data-Privacy-Act-2012.pdf"
                                target="_blank"
                                className="underline text-blue-600 hover:text-blue-800"
                                rel="noopener noreferrer"
                            >
                                Privacy Policy
                            </a>.
                        </label>
                    </div>
                    <InputError message={errors.agree} className="mt-2" />

                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <Link
                            href={route('login')}
                            className="rounded-md text-sm text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        >
                            Already registered?{' '}
                            <span className="underline hover:text-gray-900">
                                Sign in
                            </span>
                        </Link>

                        <Button disabled={processing} className="w-full md:w-auto flex justify-center">
                            {processing ? "Signing up" : "Sign up"}
                        </Button>
                    </div>
                </form>
            </div>
        </>
    )
}
