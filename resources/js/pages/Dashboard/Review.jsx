import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import DatePicker from "@/components/DatePicker"
import { Button } from "@/components/ui/button"
import { Fieldset } from "@/components/Fieldset"
import { Badge } from "@/components/ui/badge"
import usePdsStore from '@/stores/usePdsStore'
import { UserPen, SquareLibrary, Plus, Trash2, Save, House, GraduationCap, FileText, BriefcaseBusiness, Waypoints, Brain } from 'lucide-react'
import SingleComboBox from "@/components/SingleComboBox"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { useState, useEffect } from 'react'
import { useForm } from '@inertiajs/react'
import Question from "./Question"
import { formatDate, formatNumberWithCommas } from "@/lib/utils.jsx"
import { getProvinceName, getCitymunName, getBarangayName } from './api'
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
import React from 'react'

const capitalizeFirstLetter = (text) => {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

const Review = ({ updateFormPersonalInformation }) => {

  const { 
    pdsState,
    pdsState: {
      personalInformation,
      familyBackground,
      educationalBackground,
      civilServiceEligibility,
      workExperience,
      voluntaryWork,
      learningAndDevelopment,
      otherInformation
    }
  } = usePdsStore()
  
  const [permanentProvinceName, setPermanentProvinceName] = useState("")
  const [permanentCitymunName, setPermanentCitymunName] = useState("")
  const [permanentBarangayName, setPermanentBarangayName] = useState("")

  const [residentialProvinceName, setResidentialProvinceName] = useState("")
  const [residentialCitymunName, setResidentialCitymunName] = useState("")
  const [residentialBarangayName, setResidentialBarangayName] = useState("")

  const fetchAddressNames = async () => {
    try {
      const permanentProvinceResponse = await getProvinceName(personalInformation.permanent_province)
      setPermanentProvinceName(permanentProvinceResponse.data.name)

      const permanentCitymunResponse = await getCitymunName(personalInformation.permanent_city)
      setPermanentCitymunName(permanentCitymunResponse.data.name)

      const permanentBarangayResponse = await getBarangayName(personalInformation.permanent_barangay)
      setPermanentBarangayName(permanentBarangayResponse.data.name)

      const residentialProvinceResponse = await getProvinceName(personalInformation.residential_province)
      setResidentialProvinceName(residentialProvinceResponse.data.name)

      const residentialCitymunResponse = await getCitymunName(personalInformation.residential_city)
      setResidentialCitymunName(residentialCitymunResponse.data.name)

      const residentialBarangayResponse = await getBarangayName(personalInformation.residential_barangay)
      setResidentialBarangayName(residentialBarangayResponse.data.name)

    } catch (error) {
      console.error('Error fetching address details:', error);
    }
  }

  useEffect(() => {
    fetchAddressNames()
}, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-semibold text-lg flex items-center"><Save className="mr-2 h-4 w-4"/>Review Your Profile</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
      <h3 className="font-semibold text-lg flex items-center"><UserPen className="mr-2 h-4 w-4"/>I. Personal Information</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
        {/* Left Column */}
        <div className="space-y-6">
          <section className="space-y-3">
            <div className="grid grid-cols-2 gap-y-2">
              <div className="text-sm text-muted-foreground">Last Name:</div>
              <div className="text-sm font-medium">{personalInformation.last_name}</div>

              <div className="text-sm text-muted-foreground">First Name:</div>
              <div className="text-sm font-medium">{personalInformation.first_name}</div>

              <div className="text-sm text-muted-foreground">Middle Name:</div>
              <div className="text-sm font-medium">{personalInformation.middle_name}</div>

              <div className="text-sm text-muted-foreground">Suffix:</div>
              <div className="text-sm font-medium">{personalInformation.ext_name}</div>

              <div className="text-sm text-muted-foreground">Date of Birth:</div>
              <div className="text-sm font-medium">{formatDate(personalInformation.birth_date)}</div>

              <div className="text-sm text-muted-foreground">Place of Birth:</div>
              <div className="text-sm font-medium">{personalInformation.birth_place}</div>

              <div className="text-sm text-muted-foreground">Sex:</div>
              <div className="text-sm font-medium">{personalInformation.gender}</div>

              <div className="text-sm text-muted-foreground">Civil Status:</div>
              <div className="text-sm font-medium">{personalInformation.civil_status}</div>

              <div className="text-sm text-muted-foreground">Height (in m.):</div>
              <div className="text-sm font-medium">{personalInformation.height}</div>

              <div className="text-sm text-muted-foreground">Weight (in kg.):</div>
              <div className="text-sm font-medium">{personalInformation.weight}</div>

              <div className="text-sm text-muted-foreground">Blood Type:</div>
              <div className="text-sm font-medium">{personalInformation.blood_type}</div>

              <div className="text-sm text-muted-foreground">GSIS No.:</div>
              <div className="text-sm font-medium">{personalInformation.gsis_no}</div>

              <div className="text-sm text-muted-foreground">PAG-IBIG No.:</div>
              <div className="text-sm font-medium">{personalInformation.pag_ibig_no}</div>

              <div className="text-sm text-muted-foreground">PhilHealth No.:</div>
              <div className="text-sm font-medium">{personalInformation.philhealth_no}</div>

              <div className="text-sm text-muted-foreground">SSS No.:</div>
              <div className="text-sm font-medium">{personalInformation.sss_no}</div>

              <div className="text-sm text-muted-foreground">TIN:</div>
              <div className="text-sm font-medium">{personalInformation.tin_no}</div>

              <div className="text-sm text-muted-foreground">Telephone No.:</div>
              <div className="text-sm font-medium">{personalInformation.telephone_no}</div>

              <div className="text-sm text-muted-foreground">Mobile No.:</div>
              <div className="text-sm font-medium">{personalInformation.mobile_no}</div>

              <div className="text-sm text-muted-foreground">Email Address:</div>
              <div className="text-sm font-medium">{personalInformation.email_address}</div>

            </div>
          </section>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <section className="space-y-3">
            <div className="grid grid-cols-2 gap-y-2">

              <div className="text-sm text-muted-foreground">Citizenship:</div>
              <div className="text-sm font-medium">{personalInformation.citizenship} {personalInformation.citizenship_by}</div>

              <div className="text-sm text-muted-foreground">If holder of dual citizenship:</div>
              <div className="text-sm font-medium">{personalInformation.citizenship_country}</div>

            </div>
          </section>

          <section className="space-y-3">
            <h3 className="font-medium text-sm text-muted-foreground">Residential Address</h3>
            <div className="grid grid-cols-2 gap-y-2">

              <div className="text-sm text-muted-foreground">House No.:</div>
              <div className="text-sm font-medium">{personalInformation.residential_house_no}</div>

              <div className="text-sm text-muted-foreground">Street:</div>
              <div className="text-sm font-medium">{personalInformation.residential_street}</div>

              <div className="text-sm text-muted-foreground">Subdivision/Village:</div>
              <div className="text-sm font-medium">{personalInformation.residential_subdivision}</div>

              <div className="text-sm text-muted-foreground">Barangay:</div>
              <div className="text-sm font-medium">{residentialBarangayName}</div>

              <div className="text-sm text-muted-foreground">City/Municipality:</div>
              <div className="text-sm font-medium">{residentialCitymunName}</div>

              <div className="text-sm text-muted-foreground">Province:</div>
              <div className="text-sm font-medium">{residentialProvinceName}</div>

              <div className="text-sm text-muted-foreground">Zip Code:</div>
              <div className="text-sm font-medium">{personalInformation.residential_zip}</div>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="font-medium text-sm text-muted-foreground">Permanent Address</h3>
            <div className="grid grid-cols-2 gap-y-2">

              <div className="text-sm text-muted-foreground">House No.:</div>
              <div className="text-sm font-medium">{personalInformation.permanent_house_no}</div>

              <div className="text-sm text-muted-foreground">Street:</div>
              <div className="text-sm font-medium">{personalInformation.permanent_street}</div>

              <div className="text-sm text-muted-foreground">Subdivision/Village:</div>
              <div className="text-sm font-medium">{personalInformation.permanent_subdivision}</div>

              <div className="text-sm text-muted-foreground">Barangay:</div>
              <div className="text-sm font-medium">{permanentBarangayName}</div>

              <div className="text-sm text-muted-foreground">City/Municipality:</div>
              <div className="text-sm font-medium">{permanentCitymunName}</div>

              <div className="text-sm text-muted-foreground">Province:</div>
              <div className="text-sm font-medium">{permanentProvinceName}</div>

              <div className="text-sm text-muted-foreground">Zip Code:</div>
              <div className="text-sm font-medium">{personalInformation.permanent_zip}</div>
            </div>
          </section>
        </div>
      </div>

      <h3 className="font-semibold text-lg flex items-center"><House className="mr-2 h-4 w-4"/>II. Family Background</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
        {/* Left Column */}
        <div className="space-y-6">
          <section className="space-y-3">
            <div className="grid grid-cols-2 gap-y-2">

              <div className="text-sm text-muted-foreground">Spouse's Last Name:</div>
              <div className="text-sm font-medium">{familyBackground.spouse.last_name}</div>

              <div className="text-sm text-muted-foreground">First Name:</div>
              <div className="text-sm font-medium">{familyBackground.spouse.first_name}</div>

              <div className="text-sm text-muted-foreground">Middle Name:</div>
              <div className="text-sm font-medium">{familyBackground.spouse.middle_name}</div>

              <div className="text-sm text-muted-foreground">Suffix:</div>
              <div className="text-sm font-medium">{familyBackground.spouse.suffix}</div>

              
              <div className="text-sm text-muted-foreground">Occupation:</div>
              <div className="text-sm font-medium">{familyBackground.spouse.occupation}</div>

              <div className="text-sm text-muted-foreground">Employer/Business Name:</div>
              <div className="text-sm font-medium">{familyBackground.spouse.employer_name}</div>

              <div className="text-sm text-muted-foreground">Business Address:</div>
              <div className="text-sm font-medium">{familyBackground.spouse.business_address}</div>

              <div className="text-sm text-muted-foreground">Telephone No.:</div>
              <div className="text-sm font-medium">{familyBackground.spouse.telephone_no}</div>

            </div>
          </section>

          <section className="space-y-3">
            <div className="grid grid-cols-2 gap-y-2">

              <div className="text-sm text-muted-foreground">Father's Last Name:</div>
              <div className="text-sm font-medium">{familyBackground.father.last_name}</div>

              <div className="text-sm text-muted-foreground">First Name:</div>
              <div className="text-sm font-medium">{familyBackground.father.first_name}</div>

              <div className="text-sm text-muted-foreground">Middle Name:</div>
              <div className="text-sm font-medium">{familyBackground.father.middle_name}</div>

              <div className="text-sm text-muted-foreground">Suffix:</div>
              <div className="text-sm font-medium">{familyBackground.father.suffix}</div>
            </div>
          </section>

          <section className="space-y-3">
            <div className="grid grid-cols-2 gap-y-2">

              <div className="text-sm text-muted-foreground">Mother's Maiden Name:</div>
              <div className="text-sm font-medium">{familyBackground.mother.maiden_name}</div>

              <div className="text-sm text-muted-foreground">Last Name:</div>
              <div className="text-sm font-medium">{familyBackground.mother.last_name}</div>

              <div className="text-sm text-muted-foreground">First Name:</div>
              <div className="text-sm font-medium">{familyBackground.mother.first_name}</div>

              <div className="text-sm text-muted-foreground">Middle Name:</div>
              <div className="text-sm font-medium">{familyBackground.mother.middle_name}</div>
            </div>
          </section>

        </div>
        {/* Right Column */}
        <div className="h-fit self-start border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name of Child</TableHead>
                <TableHead>Date of Birth</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="font-medium">
            {familyBackground.children.length > 0 ? (
              familyBackground.children.map((child, index) => (
                <TableRow key={index}>
                  <TableCell>
                    {child.first_name} {child.middle_name} {child.last_name} {child.ext_name}
                  </TableCell>
                  <TableCell>{formatDate(child.birth_date)}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={2} className="text-center py-4 text-muted-foreground">
                  No children records found.
                </TableCell>
              </TableRow>
            )}
            </TableBody>
          </Table>
        </div>
      </div>

      <h3 className="font-semibold text-lg flex items-center"><GraduationCap className="mr-2 h-4 w-4"/>III. Educational Background</h3>
      <div className="space-y-6 border rounded-lg mb-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-center" rowSpan={2}>Level</TableHead>
              <TableHead className="text-center" rowSpan={2}>
                <div className="flex flex-col">
                  <span>Name of School</span>
                  <span>(Write in full)</span>
                </div>
              </TableHead>
              <TableHead className="text-center" rowSpan={2}>
                <div className="flex flex-col">
                  <span>Basic Education/Degree/Course</span>
                  <span>(Write in full)</span>
                </div>
              </TableHead>
              <TableHead className="text-center" colSpan={2}>Period of Attendance</TableHead>
              <TableHead className="text-center" rowSpan={2}>
                <div className="flex flex-col">
                  <span>Highest Level/Units Earned</span>
                  <span>(if not graduated)</span>
                </div>
              </TableHead>
              <TableHead className="text-center" rowSpan={2}>Year Graduated</TableHead>
              <TableHead className="text-center" rowSpan={2}>
                <div className="flex flex-col">
                  <span>Scholarship/Academic</span>
                  <span>Honors Received</span>
                </div>
              </TableHead>
            </TableRow>
            <TableRow>
              <TableHead className="text-center">From</TableHead>
              <TableHead className="text-center">To</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="font-medium">
          {educationalBackground.elementary.map((child, index) => (
            <TableRow key={index}>
              <TableCell>ELEMENTARY</TableCell>
              <TableCell>{child.school}</TableCell>
              <TableCell>{child.course}</TableCell>
              <TableCell className="text-center">{child.from_date}</TableCell>
              <TableCell className="text-center">{child.to_date}</TableCell>
              <TableCell className="text-center">{child.highest_attainment}</TableCell>
              <TableCell className="text-center">{child.year_graduated}</TableCell>
              <TableCell>{child.award}</TableCell>
            </TableRow>
          ))}
          {educationalBackground.secondary.map((child, index) => (
            <TableRow key={index}>
              <TableCell>SECONDARY</TableCell>
              <TableCell>{child.school}</TableCell>
              <TableCell>{child.course}</TableCell>
              <TableCell className="text-center">{child.from_date}</TableCell>
              <TableCell className="text-center">{child.to_date}</TableCell>
              <TableCell className="text-center">{child.highest_attainment}</TableCell>
              <TableCell className="text-center">{child.year_graduated}</TableCell>
              <TableCell>{child.award}</TableCell>
            </TableRow>
          ))}
          {educationalBackground.vocational.map((child, index) => (
            <TableRow key={index}>
              <TableCell>VOCATIONAL/TRADE COURSE</TableCell>
              <TableCell>{child.school}</TableCell>
              <TableCell>{child.course}</TableCell>
              <TableCell className="text-center">{child.from_date}</TableCell>
              <TableCell className="text-center">{child.to_date}</TableCell>
              <TableCell className="text-center">{child.highest_attainment}</TableCell>
              <TableCell className="text-center">{child.year_graduated}</TableCell>
              <TableCell>{child.award}</TableCell>
            </TableRow>
          ))}
          {educationalBackground.college.map((child, index) => (
            <TableRow key={index}>
              <TableCell>COLLEGE</TableCell>
              <TableCell>{child.school}</TableCell>
              <TableCell>{child.course}</TableCell>
              <TableCell className="text-center">{child.from_date}</TableCell>
              <TableCell className="text-center">{child.to_date}</TableCell>
              <TableCell className="text-center">{child.highest_attainment}</TableCell>
              <TableCell className="text-center">{child.year_graduated}</TableCell>
              <TableCell>{child.award}</TableCell>
            </TableRow>
          ))}
          {educationalBackground.graduate.map((child, index) => (
            <TableRow key={index}>
              <TableCell>GRADUATE STUDIES</TableCell>
              <TableCell>{child.school}</TableCell>
              <TableCell>{child.course}</TableCell>
              <TableCell className="text-center">{child.from_date}</TableCell>
              <TableCell className="text-center">{child.to_date}</TableCell>
              <TableCell className="text-center">{child.highest_attainment}</TableCell>
              <TableCell className="text-center">{child.year_graduated}</TableCell>
              <TableCell>{child.award}</TableCell>
            </TableRow>
          ))}
          </TableBody>
        </Table>
      </div>

      <h3 className="font-semibold text-lg flex items-center"><FileText className="mr-2 h-4 w-4"/>IV. Civil Service Eligibility</h3>
      <div className="space-y-6 border rounded-lg mb-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead rowSpan={2}>#</TableHead>
              <TableHead className="text-center" rowSpan={2}>
                <div className="flex flex-col">
                  <span>Career Service/RA 1080 (Board/Bar) Under</span>
                  <span>Special Laws/CES/CSEE</span>
                  <span>Barangay Eligibility/Driver's License</span>
                </div>
              </TableHead>
              <TableHead className="text-center" rowSpan={2}>
                <div className="flex flex-col">
                  <span>Rating</span>
                  <span>(if applicable)</span>
                </div>
              </TableHead>
              <TableHead className="text-center" rowSpan={2}>Date of Examination/Conferment</TableHead>
              <TableHead className="text-center" rowSpan={2}>Place of Examination/Conferment</TableHead>
              <TableHead className="text-center" colSpan={2}>License (if applicable)</TableHead>
            </TableRow>
            <TableRow>
              <TableHead className="text-center">Number</TableHead>
              <TableHead className="text-center">Date of Validity</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="font-medium">
          {civilServiceEligibility.map((child, index) => (
            <TableRow key={index}>
              <TableCell>{index+1}</TableCell>
              <TableCell>{child.eligibility}</TableCell>
              <TableCell className="text-center">{child.rating}</TableCell>
              <TableCell className="text-center">{formatDate(child.exam_date)}</TableCell>
              <TableCell>{child.exam_place}</TableCell>
              <TableCell className="text-center">{child.license_no}</TableCell>
              <TableCell className="text-center">{formatDate(child.validity_date)}</TableCell>
            </TableRow>
          ))}
          </TableBody>
        </Table>
      </div>

      <h3 className="font-semibold text-lg flex items-center"><BriefcaseBusiness className="mr-2 h-4 w-4"/>V. Work Experience</h3>
      <div className="space-y-6 border rounded-lg mb-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead rowSpan={2}>#</TableHead>
              <TableHead className="text-center" colSpan={2}>
                <div className="flex flex-col">
                  <span>Inclusive Dates</span>
                  <span>(mm/dd/yyyy)</span>
                </div>
              </TableHead>
              <TableHead className="text-center" rowSpan={2}>
                <div className="flex flex-col">
                  <span>Position Title</span>
                  <span>(Write in full/Do not abbreviate)</span>
                </div>
              </TableHead>
              <TableHead className="text-center" rowSpan={2}>
                <div className="flex flex-col">
                  <span>Department/Agency/Office/Company</span>
                  <span>(Write in full/Do not abbreviate)</span>
                </div>
              </TableHead>
              <TableHead className="text-center" rowSpan={2}>Monthly Salary</TableHead>
              <TableHead className="text-center" rowSpan={2}>
                <div className="flex flex-col">
                  <span>Salary/Job/Pay Grade (if applicable)</span>
                  <span>& Step (Format "00-0")/Increment</span>
                </div>
              </TableHead>
              <TableHead className="text-center" rowSpan={2}>Status of Appointment</TableHead>
              <TableHead className="text-center" rowSpan={2}>
                <div className="flex flex-col">
                  <span>Gov't Service</span>
                  <span>(Y/N)</span>
                </div>
              </TableHead>
            </TableRow>
            <TableRow>
              <TableHead className="text-center">From</TableHead>
              <TableHead className="text-center">To</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="font-medium">
          {workExperience.map((child, index) => (
            <TableRow key={index}>
              <TableCell>{index+1}</TableCell>
              <TableCell className="text-center">{formatDate(child.from_date)}</TableCell>
              <TableCell className="text-center">{formatDate(child.to_date)}</TableCell>
              <TableCell>{child.position}</TableCell>
              <TableCell>{child.agency}</TableCell>
              <TableCell className="text-center">{formatNumberWithCommas(child.monthly_salary)}</TableCell>
              <TableCell className="text-center">{child.grade}-{child.step}</TableCell>
              <TableCell className="text-center">{child.appointment}</TableCell>
              <TableCell className="text-center">{child.isGovtService? "Y" : "N"}</TableCell>
            </TableRow>
          ))}
          </TableBody>
        </Table>
      </div>

      <h3 className="font-semibold text-lg flex items-center"><Waypoints className="mr-2 h-4 w-4"/>VI. Voluntary Work or Involvement in Civic/Non-Government/People/Voluntary Organization/s</h3>
      <div className="space-y-6 border rounded-lg mb-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead rowSpan={2}>#</TableHead>
              <TableHead className="text-center" rowSpan={2}>
                <div className="flex flex-col">
                  <span>Name & Address of Organization</span>
                  <span>(Write in full)</span>
                </div>
              </TableHead>
              <TableHead className="text-center" colSpan={2}>
                <div className="flex flex-col">
                  <span>Inclusive Dates</span>
                  <span>(mm/dd/yyyy)</span>
                </div>
              </TableHead>
              <TableHead className="text-center" rowSpan={2}>Number of Hours</TableHead>
              <TableHead className="text-center" rowSpan={2}>Position/Nature of Work</TableHead>
            </TableRow>
            <TableRow>
              <TableHead className="text-center">From</TableHead>
              <TableHead className="text-center">To</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="font-medium">
          {voluntaryWork.map((child, index) => (
            <TableRow key={index}>
              <TableCell>{index+1}</TableCell>
              <TableCell>{child.org_name}</TableCell>
              <TableCell className="text-center">{formatDate(child.from_date)}</TableCell>
              <TableCell className="text-center">{formatDate(child.to_date)}</TableCell>
              <TableCell className="text-center">{child.hours}</TableCell>
              <TableCell className="text-center">{child.nature_of_work}</TableCell>
            </TableRow>
          ))}
          </TableBody>
        </Table>
      </div>

      <h3 className="font-semibold text-lg flex items-center"><Brain className="mr-2 h-4 w-4"/>VII. Learning and Development (L&D) Interventions/Training Programs Attended</h3>
      <div className="space-y-6 border rounded-lg mb-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead rowSpan={2}>#</TableHead>
              <TableHead className="text-center" rowSpan={2}>
                <div className="flex flex-col">
                  <span>Title of Learning and Development Interventions/Training Programs</span>
                  <span>(Write in full)</span>
                </div>
              </TableHead>
              <TableHead className="text-center" colSpan={2}>
                <div className="flex flex-col">
                  <span>Inclusive Dates of Attendance</span>
                  <span>(mm/dd/yyyy)</span>
                </div>
              </TableHead>
              <TableHead className="text-center" rowSpan={2}>Number of Hours</TableHead>
              <TableHead className="text-center" rowSpan={2}>
                <div className="flex flex-col">
                  <span>Type of LD</span>
                  <span>(Managerial/Supervisory/Technical/etc)</span>
                </div>
              </TableHead>
              <TableHead className="text-center" rowSpan={2}>
                <div className="flex flex-col">
                  <span>Conducted/Sponsored By</span>
                  <span>(Write in full)</span>
                </div>
              </TableHead>
            </TableRow>
            <TableRow>
              <TableHead className="text-center">From</TableHead>
              <TableHead className="text-center">To</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="font-medium">
          {learningAndDevelopment.map((child, index) => (
            <TableRow key={index}>
              <TableCell>{index+1}</TableCell>
              <TableCell>{child.training_title}</TableCell>
              <TableCell className="text-center">{formatDate(child.from_date)}</TableCell>
              <TableCell className="text-center">{formatDate(child.to_date)}</TableCell>
              <TableCell className="text-center">{child.hours}</TableCell>
              <TableCell className="text-center">{child.type}</TableCell>
              <TableCell>{child.conducted_by}</TableCell>
            </TableRow>
          ))}
          </TableBody>
        </Table>
      </div>

      <h3 className="font-semibold text-lg flex items-center"><SquareLibrary className="mr-2 h-4 w-4"/>VIII. Other Information</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
        <div className="h-fit self-start border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Special Skills and Hobbies</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="font-medium">
            {otherInformation.skills.map((child, index) => (
                <TableRow key={index}>
                  <TableCell>{index+1}</TableCell>
                  <TableCell>{child.description}</TableCell>
                </TableRow>
              ))
            }
            </TableBody>
          </Table>
        </div>
        <div className="h-fit self-start border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead className="text-center">
                  <div className="flex flex-col">
                    <span>Non-Academic Distinctions/Recognition</span>
                    <span>(Write in full)</span>
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="font-medium">
            {otherInformation.recognitions.map((child, index) => (
                <TableRow key={index}>
                  <TableCell>{index+1}</TableCell>
                  <TableCell>{child.description}</TableCell>
                </TableRow>
              ))
            }
            </TableBody>
          </Table>
        </div>
        <div className="h-fit self-start border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead className="text-center">
                  <div className="flex flex-col">
                    <span>Membership in Association/Organization</span>
                    <span>(Write in full)</span>
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="font-medium">
            {otherInformation.memberships.map((child, index) => (
                <TableRow key={index}>
                  <TableCell>{index+1}</TableCell>
                  <TableCell>{child.description}</TableCell>
                </TableRow>
              ))
            }
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-1/2">Questions</TableHead>
              <TableHead className="w-1/2">Answers</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="font-medium">
            {otherInformation.questions.map((question, index) => (
              <React.Fragment key={index}>
                <TableRow key={`question-${index}`} className="bg-muted/10">
                  <TableCell className="align-top">
                    {question.item_no}. {question.question}
                  </TableCell>
                  <TableCell>{question.answer ? (
                    <div className="flex flex-col gap-2">
                      <Badge className="w-fit self-start">{capitalizeFirstLetter(question.answer)}</Badge>
                      <div>{question.question_details}: <span className="underline">{question.details}</span></div>
                    </div>
                  ) : ""}</TableCell>
                </TableRow>

                {question.subQuestions?.map((subQuestion, subIndex) => (
                  <TableRow key={`subquestion-${index}-${subIndex}`}>
                    <TableCell className="pl-8 align-top">
                      {subQuestion.list}. {subQuestion.question}
                    </TableCell>
                    <TableCell>{subQuestion.answer ? (
                    <div className="flex flex-col gap-2">
                      <Badge className="w-fit self-start">{capitalizeFirstLetter(subQuestion.answer)}</Badge>
                      <div>{subQuestion.question_details}: <span className="underline">{subQuestion.details}</span></div>
                    </div>
                  ) : ""}</TableCell>
                  </TableRow>
                ))}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </div>

      <h4 className="font-semibold text-normal">References</h4>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>Contact No.</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="font-medium">
          {otherInformation.references.map((child, index) => (
              <TableRow key={index}>
                <TableCell>{index+1}</TableCell>
                <TableCell>{child.name}</TableCell>
                <TableCell>{child.address}</TableCell>
                <TableCell>{child.contact_no}</TableCell>
              </TableRow>
            ))
          }
          </TableBody>
        </Table>
      </div>
      </CardContent>
    </Card>
  )
}

export default Review