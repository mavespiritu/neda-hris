import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle,
    DialogDescription, 
    DialogClose,
    DialogFooter 
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { store } from './store'
import { useForm } from '@inertiajs/react'
import { Loader2 } from "lucide-react"
import { Label } from "@/components/ui/label"
import DatePicker from "@/components/DatePicker"
import TimePicker from "@/components/TimePicker"
import { useToast } from "@/hooks/use-toast"
import { useEffect } from "react"
import { parse, format } from 'date-fns'

const RequestForm = () => {

    const { toast } = useToast()

    const { 
        initialValues,
        isRequestFormOpen, 
        closeRequestForm,
        selectedItem,
        submitRequest
    } = store()

    const { 
        data, 
        setData, 
        post, 
        put,
        processing,
        errors, 
        reset,
        clearErrors 
    } = useForm(initialValues)

    /* useEffect(() => {
        if (isRequestFormOpen && selectedItem) {
            setData({
                date_published: selectedItem.date_published || "",
                date_closed: selectedItem.date_closed || "",
                time_closed: selectedItem.time_closed
                    ? format(parse(selectedItem.time_closed, "HH:mm:ss", new Date()), "HH:mm")
                    : "",
            })
        } else if (!isRequestFormOpen) {
            reset()
            clearErrors()
        }
    }, [isRequestFormOpen, selectedItem]) */

    useEffect(() => {
        if (isRequestFormOpen && selectedItem) {
            setData({
                ...initialValues,
                ...selectedItem,
                time_closed: selectedItem.time_closed
                    ? format(parse(selectedItem.time_closed, "HH:mm:ss", new Date()), "HH:mm")
                    : "",
            })
        } else if (!isRequestFormOpen) {
            reset()
            clearErrors()
        }
    }, [isRequestFormOpen, selectedItem])

    const handleSubmit = (e) => {
        e.preventDefault()
        submitRequest({
            form: { post, put, reset, clearErrors },
            toast
        })
    }

    return (
        <Dialog 
            open={isRequestFormOpen}
            onOpenChange={(open) => {
                if (!open) {
                    reset()
                    clearErrors()
                    closeRequestForm()
                }
            }}
        >
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Edit Publication</DialogTitle>
                    <DialogDescription>Fill-up all required fields.</DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <Label htmlFor="date_published">Posting Date</Label>
                            <DatePicker
                                placeholder="Select a date"
                                value={data.date_published}
                                onDateChange={(date) => setData('date_published', date)}
                                invalidMessage={errors.date_published}
                            />
                        </div>

                        <div className="space-y-1">
                            <Label htmlFor="date_closed">Closing Date</Label>
                            <DatePicker
                                placeholder="Select a date"
                                value={data.date_closed}
                                onDateChange={(date) => setData('date_closed', date)}
                                invalidMessage={errors.date_closed}
                            />
                        </div>

                        <div className="space-y-1">
                            <Label htmlFor="time_closed">Closing Time</Label>
                            <TimePicker
                                value={data.time_closed}
                                onTimeChange={(time) => setData('time_closed', time)}
                                invalidMessage={errors.time_closed}
                            />
                        </div>
                    </div>

                    <DialogFooter className="mt-4">
                        <DialogClose asChild>
                            <Button type="button" variant="ghost">
                              Cancel
                            </Button>
                        </DialogClose>
                        <Button 
                            type="submit" 
                            disabled={processing}
                        >
                            {processing ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    <span>Please wait</span>
                                </>
                            ) : 'Submit'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

export default RequestForm