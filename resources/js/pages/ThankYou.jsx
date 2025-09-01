import { usePage } from "@inertiajs/react"

const ThankYou = () => {
  const { message } = usePage().props

  return (
    <div className="mb-4 text-sm font-mediu">
        {message}
    </div>
  )
}

export default ThankYou