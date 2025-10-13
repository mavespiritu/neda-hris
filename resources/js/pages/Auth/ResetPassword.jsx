import InputError from '@/components/InputError';
import InputLabel from '@/components/InputLabel';
import PrimaryButton from '@/components/PrimaryButton';
import TextInput from '@/components/TextInput';
import GuestLayout from '@/layouts/GuestLayout';
import { Head, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

export default function ResetPassword({
    token,
    email,
}) {
    const { data, setData, post, processing, errors, reset } = useForm({
        token: token,
        email: email,
        password: '',
        password_confirmation: '',
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('password.store'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <>
            <Head title="Reset Password" />

            <div className="flex flex-col items-center justify-center w-full py-8">

                <h3 className="text-xl font-semibold mb-2">Reset Password</h3>
                <p className="text-sm text-gray-600 mb-6 text-center max-w-md">
                    Please enter your new password below. Make sure it’s something secure and easy for you to remember.
                    <br />
                    <br />
                    <span className="text-gray-500">
                    Your new password must be different from your previous one.
                    </span>
                </p>

                <form onSubmit={submit} className="w-[50%] md:w-[30%] lg:w-[40%] xl:w-[20%] 2xl:w-[15%] flex flex-col">
                    <div>
                        <InputLabel htmlFor="email" value="Email" />

                        <TextInput
                            id="email"
                            type="email"
                            name="email"
                            value={data.email}
                            className="mt-1 block"
                            autoComplete="username"
                            isInvalid={errors.email}
                            onChange={(e) => setData('email', e.target.value)}
                            disabled
                        />

                        <InputError message={errors.email} className="mt-2" />
                    </div>

                    <div className="mt-4">
                        <InputLabel htmlFor="password" value="Password" />

                        <TextInput
                            id="password"
                            type="password"
                            name="password"
                            value={data.password}
                            className="mt-1 block w-full"
                            autoComplete="new-password"
                            isFocused={true}
                            isInvalid={errors.password}
                            onChange={(e) => setData('password', e.target.value)}
                        />

                        <InputError message={errors.password} className="mt-2" />
                    </div>

                    <div className="mt-4">
                        <InputLabel
                            htmlFor="password_confirmation"
                            value="Confirm Password"
                        />

                        <TextInput
                            type="password"
                            name="password_confirmation"
                            value={data.password_confirmation}
                            className="mt-1 block w-full"
                            autoComplete="new-password"
                            isInvalid={errors.password_confirmation}
                            onChange={(e) =>
                                setData('password_confirmation', e.target.value)
                            }
                        />

                        <InputError
                            message={errors.password_confirmation}
                            className="mt-2"
                        />
                    </div>

                    <div className="mt-4 flex items-center justify-end">
                        <Button className="w-full" disabled={processing}>
                        {processing ? (
                            <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Resetting...
                            </>
                        ) : (
                            'Reset Password'
                        )}
                        </Button>
                    </div>
                </form>

            </div>
        </>
    );
}
