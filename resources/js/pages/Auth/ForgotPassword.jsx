import InputError from '@/components/InputError'
import InputLabel from '@/components/InputLabel'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import TextInput from '@/components/TextInput'
import { Head, useForm } from '@inertiajs/react'
import { Loader2 } from 'lucide-react'

export default function ForgotPassword({ status }) {
  const { data, setData, post, processing, errors } = useForm({
    email: '',
  })

  const submit = (e) => {
    e.preventDefault()
    post(route('password.email'))
  }

  return (
    <>
      <Head title="Forgot Password" />

      <div className="flex flex-col items-center justify-center w-full py-8">

        <h3 className="text-xl font-semibold mb-2">Forgot Password</h3>
        <p className="text-sm text-gray-600 mb-6 text-center max-w-md">
            Type your email address and we will email you a password reset link that will allow you to choose a new one.
        </p>

        {status && (
            <div className="mb-4 text-sm font-medium text-green-600">
            {status}
            </div>
        )}

        <form onSubmit={submit} className="w-[50%] md:w-[30%] lg:w-[40%] xl:w-[20%] 2xl:w-[15%] flex flex-col">
            <div>
                <InputLabel htmlFor="email" value="Your Email Address" />
                <TextInput
                    id="email"
                    type="email"
                    name="email"
                    value={data.email}
                    className="mt-1 block w-full"
                    isFocused={true}
                    isInvalid={errors.email}
                    onChange={(e) => setData('email', e.target.value)}
                />
                <InputError message={errors.email} className="mt-2" />
            </div>

            <div className="mt-4 flex items-center">
            <Button className="w-full" disabled={processing}>
              {processing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                'Email Password Reset Link'
              )}
            </Button>
          </div>
        </form>

      </div>
    </>
  )
}
