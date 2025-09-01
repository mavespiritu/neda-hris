import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import DatePicker from "@/components/DatePicker"
import { Button } from "@/components/ui/button"
import { Fieldset } from "@/components/Fieldset"
import usePdsStore from '@/stores/usePdsStore'
import { GraduationCap, Plus, Trash2 } from 'lucide-react'
import SingleComboBox from "@/components/SingleComboBox"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { useState, useEffect } from 'react'
import { useForm } from '@inertiajs/react'
import TextInput from "@/components/TextInput"
import { YearPicker } from "@/components/YearPicker"

const EducationalBackground = ({ updateFormData }) => {

  const { 
    pdsState,
    pdsState: {
      educationalBackground
    },
    addEducation,
    updateEducation,
    removeEducation,
  } = usePdsStore()

  const { data, setData, post, processing, errors, clearErrors, reset, progress } = useForm(educationalBackground)

  useEffect(() => {
      updateFormData(data)
  }, [data])

  const { toast } = useToast()

  const handleAddEducation = (type) => {
    const newEntry = {
      level: type,
      course: "",
      school: "",
      highest_attainment: "",
      from_date: "",
      to_date: "",
      award: "",
      year_graduated: "",
    }
    setData(prevData => ({
      ...prevData,
      [type.toLowerCase()]: [...prevData[type.toLowerCase()], newEntry]
    }))
    addEducation(type)
  }

  const handleUpdateEducation = (type, index, field, value) => {
    setData(prevData => ({
      ...prevData,
      [type.toLowerCase()]: prevData[type.toLowerCase()].map((entry, i) => 
        i === index ? { ...entry, [field]: value } : entry
      )
    }))
    updateEducation(type, index, field, value)
  }

  const handleRemoveEducation = (type, index) => {
    setData(prevData => ({
      ...prevData,
      [type.toLowerCase()]: prevData[type.toLowerCase()].filter((_, i) => i !== index)
    }))
    removeEducation(type, index)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-semibold text-lg flex items-center"><GraduationCap className="mr-2 h-4 w-4"/> Educational Background</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Fieldset legend="Elementary">
          <p className="text-sm">List your entries from the most recent up to the oldest.</p>
          {educationalBackground.elementary.map((child, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Elementary Entry # {index + 1}
                </CardTitle>
                {index > 0 && (
                  <Button 
                    type="button"
                    variant="destructive" 
                    onClick={() => handleRemoveEducation('Elementary', index)}
                    className="flex"
                    size="sm"
                    >
                    
                    <Trash2 className="h-4 w-4" />
                    <span className="hidden md:block">Remove</span>
                  </Button>
                )}
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor={`elementary.school_${index}`}>Name of School</Label>
                    <Input
                      id={`elementary.school_${index}`}
                      value={child.school}
                      onChange={(e) => handleUpdateEducation('Elementary', index, 'school', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`elementary.course_${index}`}>Basic Education/Degree/Course (write in full)</Label>
                    <Input
                      id={`elementary.course_${index}`}
                      value={child.course}
                      onChange={(e) => handleUpdateEducation('Elementary', index, 'course', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`elementary.period_of_attendance_${index}`}>Period of Attendance (Year)</Label>
                    <div className="flex gap-4">
                      <div className="flex-1 w-[45%]">
                        <YearPicker 
                          value={child.from_date} 
                          onChange={(value) => handleUpdateEducation('Elementary', index, 'from_date', value)}
                          startYear={1950} 
                          placeholder="Select year" 
                        />
                      </div>
                      <div className="flex-1 w-[45%]">
                        <YearPicker 
                          value={child.to_date} 
                          onChange={(value) => handleUpdateEducation('Elementary', index, 'to_date', value)}
                          startYear={1950} 
                          placeholder="Select year" 
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* Highest Level/Units Earned (if not graduated) */}
                  <div>
                    <Label htmlFor={`elementary.highest_attainment_${index}`}>Highest Level/Units Earned (if not graduated)</Label>  
                    <Input
                      id={`elementary.highest_attainment_${index}`}
                      value={child.highest_attainment}
                      onChange={(e) => handleUpdateEducation('Elementary', index, 'highest_attainment', e.target.value)}
                      placeholder=""
                      className="w-full"
                    />
                  </div>

                  {/* Year Graduated */}
                  <div>
                    <Label htmlFor={`elementary.year_graduated_${index}`}>Year Graduated</Label>  
                    <YearPicker 
                      value={child.year_graduated} 
                      onChange={(value) => handleUpdateEducation('Elementary', index, 'year_graduated', value)}
                      startYear={1950} 
                      placeholder="Select year" 
                    />
                  </div>

                  {/* Scholarship / Academic Honors Received */}
                  <div>
                    <Label htmlFor={`elementary.award_${index}`}>Scholarship / Academic Honors Received</Label>  
                    <Input
                      id={`elementary.award_${index}`}
                      value={child.award}
                      onChange={(e) => handleUpdateEducation('Elementary', index, 'award', e.target.value)}
                      placeholder=""
                      className="w-full"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          <Button type="button" onClick={() => handleAddEducation('Elementary')} variant="secondary" className="flex">
            <Plus className="h-4 w-4" />
            Add Entry
          </Button>
        </Fieldset>
        <Fieldset legend="Secondary">
          <p className="text-sm">List your entries from the most recent up to the oldest.</p>
          {educationalBackground.secondary.map((child, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Secondary Entry # {index + 1}
                </CardTitle>
                {index > 0 && (
                  <Button 
                    type="button"
                    variant="destructive" 
                    onClick={() => handleRemoveEducation('Secondary', index)}
                    className="flex"
                    size="sm"
                    >
                    
                    <Trash2 className="h-4 w-4" />
                    <span className="hidden md:block">Remove</span>
                  </Button>
                )}
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor={`secondary.school_${index}`}>Name of School</Label>
                    <Input
                      id={`secondary.school_${index}`}
                      value={child.school}
                      onChange={(e) => handleUpdateEducation('Secondary', index, 'school', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`secondary.course_${index}`}>Basic Education/Degree/Course (write in full)</Label>
                    <Input
                      id={`secondary.course_${index}`}
                      value={child.course}
                      onChange={(e) => handleUpdateEducation('Secondary', index, 'course', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`secondary.period_of_attendance_${index}`}>Period of Attendance (Year)</Label>
                    <div className="flex gap-4">
                      <div className="flex-1 w-[45%]">
                        <YearPicker 
                          value={child.from_date} 
                          onChange={(value) => handleUpdateEducation('Secondary', index, 'from_date', value)}
                          startYear={1950} 
                          placeholder="Select year" 
                        />
                      </div>
                      <div className="flex-1 w-[45%]">
                        <YearPicker 
                          value={child.to_date} 
                          onChange={(value) => handleUpdateEducation('Secondary', index, 'to_date', value)}
                          startYear={1950} 
                          placeholder="Select year" 
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* Highest Level/Units Earned (if not graduated) */}
                  <div>
                    <Label htmlFor={`secondary.highest_attainment_${index}`}>Highest Level/Units Earned (if not graduated)</Label>  
                    <Input
                      id={`secondary.highest_attainment_${index}`}
                      value={child.highest_attainment}
                      onChange={(e) => handleUpdateEducation('Secondary', index, 'highest_attainment', e.target.value)}
                      placeholder=""
                      className="w-full"
                    />
                  </div>

                  {/* Year Graduated */}
                  <div>
                    <Label htmlFor={`secondary.year_graduated_${index}`}>Year Graduated</Label>  
                    <YearPicker 
                      value={child.year_graduated} 
                      onChange={(value) => handleUpdateEducation('Secondary', index, 'year_graduated', value)}
                      startYear={1950} 
                      placeholder="Select year" 
                    />
                  </div>

                  {/* Scholarship / Academic Honors Received */}
                  <div>
                    <Label htmlFor={`secondary.award_${index}`}>Scholarship / Academic Honors Received</Label>  
                    <Input
                      id={`secondary.award_${index}`}
                      value={child.award}
                      onChange={(e) => handleUpdateEducation('Secondary', index, 'award', e.target.value)}
                      placeholder=""
                      className="w-full"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          <Button type="button" onClick={() => handleAddEducation('Secondary')} variant="secondary" className="flex">
            <Plus className="h-4 w-4" />
            Add Entry
          </Button>
        </Fieldset>
        <Fieldset legend="College">
          <p className="text-sm">List your entries from the most recent up to the oldest.</p>
          {educationalBackground.college.map((child, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  College Entry # {index + 1}
                </CardTitle>
                {index > 0 && (
                  <Button 
                    type="button"
                    variant="destructive" 
                    onClick={() => handleRemoveEducation('College', index)}
                    className="flex"
                    size="sm"
                    >
                    
                    <Trash2 className="h-4 w-4" />
                    <span className="hidden md:block">Remove</span>
                  </Button>
                )}
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor={`college.school_${index}`}>Name of School</Label>
                    <Input
                      id={`college.school_${index}`}
                      value={child.school}
                      onChange={(e) => handleUpdateEducation('College',index, 'school', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`college.course_${index}`}>Basic Education/Degree/Course (write in full)</Label>
                    <Input
                      id={`college.course_${index}`}
                      value={child.course}
                      onChange={(e) => handleUpdateEducation('College',index, 'course', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`college.period_of_attendance_${index}`}>Period of Attendance (Year)</Label>
                    <div className="flex gap-4">
                      <div className="flex-1 w-[45%]">
                        <YearPicker 
                          value={child.from_date} 
                          onChange={(value) => handleUpdateEducation('College', index, 'from_date', value)}
                          startYear={1950} 
                          placeholder="Select year" 
                        />
                      </div>
                      <div className="flex-1 w-[45%]">
                        <YearPicker 
                          value={child.to_date} 
                          onChange={(value) => handleUpdateEducation('College', index, 'to_date', value)}
                          startYear={1950} 
                          placeholder="Select year" 
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* Highest Level/Units Earned (if not graduated) */}
                  <div>
                    <Label htmlFor={`college.highest_attainment_${index}`}>Highest Level/Units Earned (if not graduated)</Label>  
                    <Input
                      id={`college.highest_attainment_${index}`}
                      value={child.highest_attainment}
                      onChange={(e) => handleUpdateEducation('College',index, 'highest_attainment', e.target.value)}
                      placeholder=""
                      className="w-full"
                    />
                  </div>

                  {/* Year Graduated */}
                  <div>
                    <Label htmlFor={`college.year_graduated_${index}`}>Year Graduated</Label>  
                    <YearPicker 
                      value={child.year_graduated} 
                      onChange={(value) => handleUpdateEducation('College', index, 'year_graduated', value)}
                      startYear={1950} 
                      placeholder="Select year" 
                    />
                  </div>

                  {/* Scholarship / Academic Honors Received */}
                  <div>
                    <Label htmlFor={`college.award_${index}`}>Scholarship / Academic Honors Received</Label>  
                    <Input
                      id={`college.award_${index}`}
                      value={child.award}
                      onChange={(e) => handleUpdateEducation('College',index, 'award', e.target.value)}
                      placeholder=""
                      className="w-full"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          <Button type="button" onClick={() => handleAddEducation('College')} variant="secondary" className="flex">
            <Plus className="h-4 w-4" />
            Add Entry
          </Button>
        </Fieldset>
        <Fieldset legend="Vocational/Trade Course">
          <p className="text-sm">List your entries from the most recent up to the oldest.</p>
          {educationalBackground.vocational.map((child, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Vocational/Trade Course Entry # {index + 1}
                </CardTitle>
                <Button 
                  type="button"
                  variant="destructive" 
                  onClick={() => handleRemoveEducation('Vocational', index)}
                  className="flex"
                  size="sm"
                  >
                  
                  <Trash2 className="h-4 w-4" />
                  <span className="hidden md:block">Remove</span>
                </Button>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor={`vocational.school_${index}`}>Name of School</Label>
                    <Input
                      id={`vocational.school_${index}`}
                      value={child.school}
                      onChange={(e) => handleUpdateEducation('Vocational', index, 'school', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`vocational.course_${index}`}>Basic Education/Degree/Course (write in full)</Label>
                    <Input
                      id={`vocational.course_${index}`}
                      value={child.course}
                      onChange={(e) => handleUpdateEducation('Vocational', index, 'course', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`vocational.period_of_attendance_${index}`}>Period of Attendance (Year)</Label>
                    <div className="flex gap-4">
                      <div className="flex-1 w-[45%]">
                        <YearPicker 
                          value={child.from_date} 
                          onChange={(value) => handleUpdateEducation('Vocational', index, 'from_date', value)}
                          startYear={1950} 
                          placeholder="Select year" 
                        />
                      </div>
                      <div className="flex-1 w-[45%]">
                        <YearPicker 
                          value={child.to_date} 
                          onChange={(value) => handleUpdateEducation('Vocational', index, 'to_date', value)}
                          startYear={1950} 
                          placeholder="Select year" 
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* Highest Level/Units Earned (if not graduated) */}
                  <div>
                    <Label htmlFor={`vocational.highest_attainment_${index}`}>Highest Level/Units Earned (if not graduated)</Label>  
                    <Input
                      id={`vocational.highest_attainment_${index}`}
                      value={child.highest_attainment}
                      onChange={(e) => handleUpdateEducation('Vocational', index, 'highest_attainment', e.target.value)}
                      placeholder=""
                      className="w-full"
                    />
                  </div>

                  {/* Year Graduated */}
                  <div>
                    <Label htmlFor={`vocational.year_graduated_${index}`}>Year Graduated</Label>  
                    <YearPicker 
                      value={child.year_graduated} 
                      onChange={(value) => handleUpdateEducation('Vocational', index, 'year_graduated', value)}
                      startYear={1950} 
                      placeholder="Select year" 
                    />
                  </div>

                  {/* Scholarship / Academic Honors Received */}
                  <div>
                    <Label htmlFor={`vocational.award_${index}`}>Scholarship / Academic Honors Received</Label>  
                    <Input
                      id={`vocational.award_${index}`}
                      value={child.award}
                      onChange={(e) => handleUpdateEducation('Vocational', index, 'award', e.target.value)}
                      placeholder=""
                      className="w-full"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          <Button type="button" onClick={() => handleAddEducation('Vocational')} variant="secondary" className="flex">
            <Plus className="h-4 w-4" />
            Add Entry
          </Button>
        </Fieldset>
        <Fieldset legend="Graduate Studies">
          <p className="text-sm">List your entries from the most recent up to the oldest.</p>
          {educationalBackground.graduate.map((child, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Graduate Studies Entry # {index + 1}
                </CardTitle>
                <Button 
                  type="button"
                  variant="destructive" 
                  onClick={() => handleRemoveEducation('Graduate', index)}
                  className="flex"
                  size="sm"
                  >
                  
                  <Trash2 className="h-4 w-4" />
                  <span className="hidden md:block">Remove</span>
                </Button>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor={`graduate.school_${index}`}>Name of School</Label>
                    <Input
                      id={`graduate.school_${index}`}
                      value={child.school}
                      onChange={(e) => handleUpdateEducation('Graduate', index, 'school', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`graduate.course_${index}`}>Basic Education/Degree/Course (write in full)</Label>
                    <Input
                      id={`graduate.course_${index}`}
                      value={child.course}
                      onChange={(e) => handleUpdateEducation('Graduate', index, 'course', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`graduate.period_of_attendance_${index}`}>Period of Attendance (Year)</Label>
                    <div className="flex gap-4">
                      <div className="flex-1 w-[45%]">
                        <YearPicker 
                          value={child.from_date} 
                          onChange={(value) => handleUpdateEducation('Graduate', index, 'from_date', value)}
                          startYear={1950} 
                          placeholder="Select year" 
                        />
                      </div>
                      <div className="flex-1 w-[45%]">
                        <YearPicker 
                          value={child.to_date} 
                          onChange={(value) => handleUpdateEducation('Graduate', index, 'to_date', value)}
                          startYear={1950} 
                          placeholder="Select year" 
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* Highest Level/Units Earned (if not graduated) */}
                  <div>
                    <Label htmlFor={`graduate.highest_attainment_${index}`}>Highest Level/Units Earned (if not graduated)</Label>  
                    <Input
                      id={`graduate.highest_attainment_${index}`}
                      value={child.highest_attainment}
                      onChange={(e) => handleUpdateEducation('Graduate',index, 'highest_attainment', e.target.value)}
                      placeholder=""
                      className="w-full"
                    />
                  </div>

                  {/* Year Graduated */}
                  <div>
                    <Label htmlFor={`graduate.year_graduated_${index}`}>Year Graduated</Label>  
                    <YearPicker 
                      value={child.year_graduated} 
                      onChange={(value) => handleUpdateEducation('Graduate', index, 'year_graduated', value)}
                      startYear={1950} 
                      placeholder="Select year" 
                    />
                  </div>

                  {/* Scholarship / Academic Honors Received */}
                  <div>
                    <Label htmlFor={`graduate.award_${index}`}>Scholarship / Academic Honors Received</Label>  
                    <Input
                      id={`graduate.award_${index}`}
                      value={child.award}
                      onChange={(e) => handleUpdateEducation('Graduate', index, 'award', e.target.value)}
                      placeholder=""
                      className="w-full"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          <Button type="button" onClick={() => handleAddEducation('Graduate')} variant="secondary" className="flex">
            <Plus className="h-4 w-4" />
            Add Entry
          </Button>
        </Fieldset>
      </CardContent>
      
    </Card>
  )
}

export default EducationalBackground