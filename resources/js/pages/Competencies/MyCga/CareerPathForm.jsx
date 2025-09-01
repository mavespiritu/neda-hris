import { useState, useEffect } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogClose
  } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"  
import { Button } from "@/components/ui/button"
import { store } from './store'
import { useToast } from "@/hooks/use-toast"
import { useForm } from '@inertiajs/react'
import SingleComboBox from "@/components/SingleComboBox"
import { Loader2 } from "lucide-react"

const CareerPathForm = ({ open, onClose }) => {
  const { toast } = useToast()

  const {
      fetchCareerPathOptions,
      careerPathOptions,
      selectedStaff,
      submitCareerPath
  } = store()

  const initialValues = {
    position_id: null
  }

  const { 
      data, 
      setData, 
      post, 
      put,
      processing,
      errors, 
      reset,
      clearErrors,
  } = useForm(initialValues)

  const handleSubmit = (e) => {
    e.preventDefault()
    submitCareerPath({
        form: { data, post, put, reset, clearErrors },
        toast,
        onClose
    })
  }

  useEffect(() => {
    if (open) {
      fetchCareerPathOptions({ id: selectedStaff.value })
      clearErrors()
    } 
    reset()
  }, [open, selectedStaff.value])

  return (
    <Dialog open={open} onOpenChange={onClose}>
        <DialogContent>
          {(careerPathOptions.isLoading) && (
              <div className="absolute inset-0 z-50 flex items-center justify-center backdrop-blur-xs bg-black/30 rounded-lg">
                  <Loader2 className="h-10 w-10 animate-spin text-white" />
              </div>
          )}
          <DialogHeader>
              <DialogTitle>Add new career path</DialogTitle>
              <DialogDescription className="text-justify">
              Select a position to be added on the list of your career path
              </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
                <Label htmlFor="position_id">Position</Label>
                <SingleComboBox 
                    items={careerPathOptions.data} 
                    onChange={(value => setData('position_id', value))}
                    invalidMessage={errors.position_id}
                    placeholder="Select position"
                    name="position"
                    id="position"
                    value={data.position_id}
                />
                {errors?.position_id && <span className="text-red-500 text-xs">{errors.position_id}</span>}
          </div>
          <div className="flex justify-end gap-2">
              <DialogClose asChild>
                  <Button type="button" variant="ghost">
                  Cancel
                  </Button>
              </DialogClose>
              <Button type="submit" disabled={processing}>
                  {processing ? (
                      <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          <span>Please wait</span>
                      </>
                  ) : 'Submit'}
              </Button>
          </div>
          </form>
        </DialogContent>
    </Dialog>
  )
}

export default CareerPathForm