import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import DatePicker from "@/components/DatePicker"
import { Fieldset } from "@/components/Fieldset"
import usePdsStore from '@/stores/usePdsStore'
import { UserPen } from 'lucide-react'
import SingleComboBox from "@/components/SingleComboBox"
import { Switch } from "@/components/ui/switch"
import { useEffect } from 'react'
import TextInput from "@/components/TextInput"

const genders = [
  { label: 'Male', value: 'Male'},
  { label: 'Female', value: 'Female'},
]

const civilStatuses = [
  { label: 'Single', value: 'Single'},
  { label: 'Married', value: 'Married'},
  { label: 'Common Law', value: 'Common Law'},
  { label: 'Separated', value: 'Separated'},
  { label: 'Widowed', value: 'Widowed'},
]

const bloodTypes = [
  { label: 'A+', value: 'A+'},
  { label: 'A-', value: 'A-'},
  { label: 'B+', value: 'B+'},
  { label: 'B-', value: 'B-'},
  { label: 'AB+', value: 'AB+'},
  { label: 'AB-', value: 'AB-'},
  { label: 'O+', value: 'O+'},
  { label: 'O-', value: 'O-'},
]

const citizenships = [
  { label: 'Filipino', value: 'Filipino'},
  { label: 'Dual Citizenship', value: 'Dual Citizenship'},
]

const citizenshipsBy = [
  { label: 'By birth', value: 'By birth'},
  { label: 'By naturalization', value: 'By naturalization'},
]

const PersonalInformation = ({ data, setData, errors = {} }) => {

  const {
    countriesState: { countries, fetchCountries },
    permanentAddressState: {
      fetchProvinces: fetchPermanentProvinces,
      fetchCitymuns: fetchPermanentCitymuns,
      fetchBarangays: fetchPermanentBarangays,
      provinces: permanentProvinces,
      citymuns: permanentCitymuns,
      barangays: permanentBarangays,
    },
    residentialAddressState: {
      fetchProvinces: fetchResidentialProvinces,
      fetchCitymuns: fetchResidentialCitymuns,
      fetchBarangays: fetchResidentialBarangays,
      provinces: residentialProvinces,
      citymuns: residentialCitymuns,
      barangays: residentialBarangays,
    },
    loading,
  } = usePdsStore()

  useEffect(() => {
    fetchCountries()
    fetchPermanentProvinces()
    fetchResidentialProvinces()
  }, [])

  // Populate dependent selects
  useEffect(() => {
    if (data.permanent_province) fetchPermanentCitymuns(data.permanent_province)
  }, [data.permanent_province])

  useEffect(() => {
    if (data.residential_province) fetchResidentialCitymuns(data.residential_province)
  }, [data.residential_province])

  useEffect(() => {
    if (data.permanent_city) fetchPermanentBarangays(data.permanent_city)
  }, [data.permanent_province, data.permanent_city])

  useEffect(() => {
    if (data.residential_city) fetchResidentialBarangays(data.residential_city)
  }, [data.residential_province, data.residential_city])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-semibold text-lg flex items-center"><UserPen className="mr-2 h-4 w-4"/> Personal Information</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Fieldset legend="Basic Information" className="bg-muted">
          <div className="grid grid-cols-1 lg:grid-cols-[28%_28%_28%_auto] gap-4">
            {/* Last Name */}
            <div>
              <Label htmlFor="last_name">Last Name</Label>  
              <TextInput 
                name="last_name" 
                onChange={(e => setData('last_name', e.target.value))}
                isInvalid={errors['personalInformation.last_name']}
                id="last_name"
                value={data.last_name}
              />
              {errors['personalInformation.last_name'] && <p className="text-red-500 text-xs mt-1">{errors['personalInformation.last_name']}</p>}
            </div>

            {/* First Name */}
            <div>
              <Label htmlFor="first_name">First Name</Label>
              <TextInput 
                name="first_name" 
                onChange={(e => setData('first_name', e.target.value))}
                isInvalid={errors['personalInformation.first_name']}
                id="first_name"
                value={data.first_name}
              />
              {errors['personalInformation.first_name'] && <p className="text-red-500 text-xs mt-1">{errors['personalInformation.first_name']}</p>}
            </div>

            {/* Middle Name */}
            <div>
              <Label htmlFor="middle_name">Middle Name</Label>
              <TextInput 
                name="middle_name" 
                onChange={(e => setData('middle_name', e.target.value))}
                isInvalid={errors['personalInformation.middle_name']}
                id="middle_name"
                value={data.middle_name}
              />
              {errors['personalInformation.middle_name'] && <p className="text-red-500 text-xs mt-1">{errors['personalInformation.middle_name']}</p>}
            </div>

            {/* Extension Name */}
            <div>
              <Label htmlFor="ext_name">Suffix</Label>
              <TextInput 
                name="ext_name" 
                onChange={(e => setData('ext_name', e.target.value))}
                isInvalid={errors['personalInformation.ext_name']}
                id="ext_name"
                value={data.ext_name}
              />
              {errors['personalInformation.ext_name'] && <p className="text-red-500 text-xs mt-1">{errors['personalInformation.ext_name']}</p>}
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Date of Birth */}
            <div>
              <Label htmlFor="birth_date">Date of Birth</Label>
              <DatePicker
                placeholder="Select a date"
                onDateChange={(date) => setData("birth_date", date)}
                value={data.birth_date}
                invalidMessage={errors['personalInformation.birth_date']}
              />
            </div>

            {/* Place of Birth */}
            <div>
              <Label htmlFor="birth_place">Place of Birth</Label>
              <TextInput 
                name="birth_place" 
                onChange={(e => setData('birth_place', e.target.value))}
                isInvalid={errors['personalInformation.birth_place']}
                id="birth_place"
                value={data.birth_place}
              />
              {errors['personalInformation.birth_place'] && <p className="text-red-500 text-xs mt-1">{errors['personalInformation.birth_place']}</p>}
            </div>

            {/* Sex and Civil Status */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="gender">Sex</Label>
                <SingleComboBox
                  items={genders}
                  placeholder="Select one"
                  name="gender"
                  id="gender"
                  onChange={(value => setData('gender', value))}
                  invalidMessage={errors['personalInformation.gender']}
                  width="w-full"
                  className="w-full"
                  value={data.gender}
                />
                {errors['personalInformation.gender'] && <p className="text-red-500 text-xs mt-1">{errors['personalInformation.gender']}</p>}
              </div>
              <div>
                <Label htmlFor="civil_status">Civil Status</Label>
                <SingleComboBox
                  items={civilStatuses}
                  placeholder="Select one"
                  name="civil_status"
                  id="civil_status"
                  onChange={(value => setData('civil_status', value))}
                  invalidMessage={errors['personalInformation.civil_status']}
                  width="w-full"
                  className="w-full"
                  value={data.civil_status}
                />
                {errors['personalInformation.civil_status'] && <p className="text-red-500 text-xs mt-1">{errors['personalInformation.civil_status']}</p>}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Height */}
            <div>
              <Label htmlFor="height">Height (in m.)</Label>  
              <TextInput 
                name="height" 
                onChange={(e => setData('height', e.target.value))}
                isInvalid={errors['personalInformation.height']}
                id="height"
                value={data.height}
              />
              {errors['personalInformation.height'] && <p className="text-red-500 text-xs mt-1">{errors['personalInformation.height']}</p>}
            </div>

            {/* Weight */}
            <div>
              <Label htmlFor="weight">Weight (in kg.)</Label>
              <TextInput 
                name="weight" 
                onChange={(e => setData('weight', e.target.value))}
                isInvalid={errors['personalInformation.weight']}
                id="weight"
                value={data.weight}
              />
              {errors['personalInformation.weight'] && <p className="text-red-500 text-xs mt-1">{errors['personalInformation.weight']}</p>}
            </div>

            {/* Blood Types */}
            <div>
                <Label htmlFor="blood_type">Blood Type</Label>
                <SingleComboBox
                  items={bloodTypes}
                  placeholder="Select one"
                  name="blood_type"
                  id="blood_type"
                  onChange={(value => setData('blood_type', value))}
                  invalidMessage={errors['personalInformation.blood_type']}
                  width="w-full"
                  className="w-full"
                  value={data.blood_type}
                />
                {errors['personalInformation.blood_type'] && <p className="text-red-500 text-xs mt-1">{errors['personalInformation.blood_type']}</p>}
              </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* GSIS */}
            <div>
              <Label htmlFor="gsis_no">GSIS No.</Label>  
              <TextInput 
                name="gsis_no" 
                onChange={(e => setData('gsis_no', e.target.value))}
                isInvalid={errors['personalInformation.gsis_no']}
                id="gsis_no"
                value={data.gsis_no}
              />
              {errors['personalInformation.gsis_no'] && <p className="text-red-500 text-xs mt-1">{errors['personalInformation.gsis_no']}</p>}
            </div>

            {/* SSS */}
            <div>
              <Label htmlFor="sss_no">SSS No.</Label>
              <TextInput 
                name="sss_no" 
                onChange={(e => setData('sss_no', e.target.value))}
                isInvalid={errors['personalInformation.sss_no']}
                id="sss_no"
                value={data.sss_no}
              />
              {errors['personalInformation.sss_no'] && <p className="text-red-500 text-xs mt-1">{errors['personalInformation.sss_no']}</p>}
            </div>

            {/* TIN */}
            <div>
              <Label htmlFor="tin_no">TIN</Label>
              <TextInput 
                name="tin_no" 
                onChange={(e => setData('tin_no', e.target.value))}
                isInvalid={errors['personalInformation.tin_no']}
                id="tin_no"
                value={data.tin_no}
              />
              {errors['personalInformation.tin_no'] && <p className="text-red-500 text-xs mt-1">{errors['personalInformation.tin_no']}</p>}
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* PAG IBIG */}
            <div>
              <Label htmlFor="pag_ibig_no">PAG-IBIG No.</Label>  
              <TextInput 
                name="pag_ibig_no" 
                onChange={(e => setData('pag_ibig_no', e.target.value))}
                isInvalid={errors['personalInformation.pag_ibig_no']}
                id="pag_ibig_no"
                value={data.pag_ibig_no}
              />
              {errors['personalInformation.pag_ibig_no'] && <p className="text-red-500 text-xs mt-1">{errors['personalInformation.pag_ibig_no']}</p>}
            </div>

            {/* PHILHEALTH */}
            <div>
              <Label htmlFor="philhealth_no">PhilHealth No.</Label>
              <TextInput 
                name="philhealth_no" 
                onChange={(e => setData('philhealth_no', e.target.value))}
                isInvalid={errors['personalInformation.philhealth_no']}
                id="philhealth_no"
                value={data.philhealth_no}
              />
              {errors['personalInformation.philhealth_no'] && <p className="text-red-500 text-xs mt-1">{errors['personalInformation.philhealth_no']}</p>}
            </div>

            {/* Agency Employee No. */}
            <div>
              <Label htmlFor="agency_employee_no">Agency Employee No.</Label>
              <TextInput 
                name="agency_employee_no" 
                onChange={(e => setData('agency_employee_no', e.target.value))}
                isInvalid={errors['personalInformation.agency_employee_no']}
                id="agency_employee_no"
                value={data.agency_employee_no}
              />
              {errors['personalInformation.agency_employee_no'] && <p className="text-red-500 text-xs mt-1">{errors['personalInformation.agency_employee_no']}</p>}
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Citizenship */}
            <div>
              <Label htmlFor="citizenship">Citizenship</Label>  
              <SingleComboBox
                items={citizenships}
                placeholder="Select one"
                name="citizenship"
                id="citizenship"
                onChange={(value => setData('citizenship', value))}
                invalidMessage={errors['personalInformation.citizenship']}
                width="w-full"
                className="w-full"
                value={data.citizenship}
              />
              {errors['personalInformation.citizenship'] && <p className="text-red-500 text-xs mt-1">{errors['personalInformation.citizenship']}</p>}
            </div>

            {/* Citizenship by */}
            <div>
              <Label htmlFor="citizenship_by">Citizenship By</Label>
              <SingleComboBox
                items={citizenshipsBy}
                placeholder="Select one"
                name="citizenship_by"
                id="citizenship_by"
                onChange={(value => setData('citizenship_by', value))}
                invalidMessage={errors['personalInformation.citizenship_by']}
                width="w-full"
                className="w-full"
                value={data.citizenship_by}
                disabled={data.citizenship === 'Filipino' || data.citizenship === ''}
              />
              {errors['personalInformation.citizenship_by'] && <p className="text-red-500 text-xs mt-1">{errors['personalInformation.citizenship_by']}</p>}
            </div>

            {/* Citizenship by country */}
            <div>
              <Label htmlFor="citizenship_country">If holder of dual citizenship, indicate country</Label>
              <SingleComboBox
                items={countries}
                placeholder="Select one"
                name="country"
                id="citizenship_country"
                onChange={(value => setData('citizenship_country', value))}
                invalidMessage={errors['personalInformation.citizenship_country']}
                width="w-full"
                className="w-full"
                value={data.citizenship_country}
                disabled={data.citizenship === 'Filipino' || data.citizenship === ''}
              />
              {errors['personalInformation.citizenship_country'] && <p className="text-red-500 text-xs mt-1">{errors['personalInformation.citizenship_country']}</p>}
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Telephone No. */}
            <div>
              <Label htmlFor="telephone_no">Telephone No.</Label>  
              <TextInput 
                name="telephone_no" 
                onChange={(e => setData('telephone_no', e.target.value))}
                isInvalid={errors['personalInformation.telephone_no']}
                id="telephone_no"
                value={data.telephone_no}
              />
              {errors['personalInformation.telephone_no'] && <p className="text-red-500 text-xs mt-1">{errors['personalInformation.telephone_no']}</p>}
            </div>

            {/* Mobile No. */}
            <div>
              <Label htmlFor="mobile_no">Mobile No.</Label>
              <TextInput 
                name="mobile_no" 
                onChange={(e => setData('mobile_no', e.target.value))}
                isInvalid={errors['personalInformation.mobile_no']}
                id="mobile_no"
                value={data.mobile_no}
              />
              {errors['personalInformation.mobile_no'] && <p className="text-red-500 text-xs mt-1">{errors['personalInformation.mobile_no']}</p>}
            </div>

            {/* Email Address */}
            <div>
              <Label htmlFor="email_address">Email Address</Label>
              <TextInput 
                name="email_address" 
                onChange={(e => setData('email_address', e.target.value))}
                isInvalid={errors['personalInformation.email_address']}
                id="email_address"
                value={data.email_address}
                //disabled={true}
              />
              {errors['personalInformation.email_address'] && <p className="text-red-500 text-xs mt-1">{errors['personalInformation.email_address']}</p>}
            </div>
          </div>
        </Fieldset>
        <Fieldset legend="Residential Address" className="bg-muted">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Province */}
            <div>
              <Label htmlFor="residential_province">Province</Label>  
              <SingleComboBox
                items={residentialProvinces}
                placeholder="Select one"
                name="province"
                id="residential_province"
                onChange={(value => setData('residential_province', value))}
                invalidMessage={errors['personalInformation.residential_province']}
                width="w-full"
                className="w-full"
                value={data.residential_province}
              />
              {errors['personalInformation.residential_province'] && <p className="text-red-500 text-xs mt-1">{errors['personalInformation.residential_province']}</p>}
            </div>

            {/* City/Municipality */}
            <div>
              <Label htmlFor="residential_city">City/Municipality</Label>
              <SingleComboBox
                items={residentialCitymuns}
                placeholder="Select one"
                name="city/municipality"
                id="residential_city"
                onChange={(value => setData('residential_city', value))}
                invalidMessage={errors['personalInformation.residential_city']}
                width="w-full"
                className="w-full"
                value={data.residential_city}
              />
              {errors['personalInformation.residential_city'] && <p className="text-red-500 text-xs mt-1">{errors['personalInformation.residential_city']}</p>}
            </div>

            {/* Barangay */}
            <div>
              <Label htmlFor="residential_barangay">Barangay</Label>
              <SingleComboBox
                items={residentialBarangays}
                placeholder="Select one"
                name="barangay"
                id="residential_barangay"
                onChange={(value => setData('residential_barangay', value))}
                invalidMessage={errors['personalInformation.residential_barangay']}
                width="w-full"
                className="w-full"
                value={data.residential_barangay}
              />
              {errors['personalInformation.residential_barangay'] && <p className="text-red-500 text-xs mt-1">{errors['personalInformation.residential_barangay']}</p>}
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* House No. */}
            <div>
              <Label htmlFor="residential_house_no">House No.</Label>  
              <TextInput 
                name="residential_house_no" 
                onChange={(e => setData('residential_house_no', e.target.value))}
                isInvalid={errors['personalInformation.residential_house_no']}
                id="residential_house_no"
                value={data.residential_house_no}
              />
              {errors['personalInformation.residential_house_no'] && <p className="text-red-500 text-xs mt-1">{errors['personalInformation.residential_house_no']}</p>}
            </div>

            {/* Street */}
            <div>
              <Label htmlFor="residential_street">Street</Label>
              <TextInput 
                name="residential_street" 
                onChange={(e => setData('residential_street', e.target.value))}
                isInvalid={errors['personalInformation.residential_street']}
                id="residential_street"
                value={data.residential_street}
              />
              {errors['personalInformation.residential_street'] && <p className="text-red-500 text-xs mt-1">{errors['personalInformation.residential_street']}</p>}
            </div>

            {/* Subdivision/Village */}
            <div>
              <Label htmlFor="residential_subdivision">Subdivision/Village</Label>
              <TextInput 
                name="residential_subdivision" 
                onChange={(e => setData('residential_subdivision', e.target.value))}
                isInvalid={errors['personalInformation.residential_subdivision']}
                id="residential_subdivision"
                value={data.residential_subdivision}
              />
              {errors['personalInformation.residential_subdivision'] && <p className="text-red-500 text-xs mt-1">{errors['personalInformation.residential_subdivision']}</p>}
            </div>

            {/* Zip */}
            <div>
              <Label htmlFor="residential_zip">Zip Code</Label>
              <TextInput 
                name="residential_zip" 
                onChange={(e => setData('residential_zip', e.target.value))}
                isInvalid={errors['personalInformation.residential_zip']}
                id="residential_zip"
                value={data.residential_zip}
              />
              {errors['personalInformation.residential_zip'] && <p className="text-red-500 text-xs mt-1">{errors['personalInformation.residential_zip']}</p>}
            </div>
          </div>
        </Fieldset>
        <div className="flex gap-4 items-center text-sm font-medium">
          <Switch 
            checked={data.isResidenceSameWithPermanentAddress}
            onCheckedChange={(isChecked) => {
              setData("isResidenceSameWithPermanentAddress", isChecked)
            }}
            value={data.isResidenceSameWithPermanentAddress}
          />
          Is residential address the same with permanent address?
        </div>
        {!data.isResidenceSameWithPermanentAddress && (
        <Fieldset legend="Permanent Address" className="bg-muted">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Province */}
            <div>
              <Label htmlFor="permanent_province">Province</Label>  
              <SingleComboBox
                items={permanentProvinces}
                placeholder="Select one"
                name="province"
                id="permanent_province"
                onChange={(value => setData('permanent_province', value))}
                invalidMessage={errors['personalInformation.permanent_province']}
                width="w-full"
                className="w-full"
                value={data.permanent_province}
                disabled={data.isResidenceSameWithPermanentAddress}
              />
              {errors['personalInformation.permanent_province'] && <p className="text-red-500 text-xs mt-1">{errors['personalInformation.permanent_province']}</p>}
            </div>

            {/* City/Municipality */}
            <div>
              <Label htmlFor="permanent_city">City/Municipality</Label>
              <SingleComboBox
                items={permanentCitymuns}
                placeholder="Select one"
                name="city/municipality"
                id="permanent_city"
                onChange={(value => setData('permanent_city', value))}
                invalidMessage={errors['personalInformation.permanent_city']}
                width="w-full"
                className="w-full"
                value={data.permanent_city}
                disabled={data.isResidenceSameWithPermanentAddress}
              />
              {errors['personalInformation.permanent_city'] && <p className="text-red-500 text-xs mt-1">{errors['personalInformation.permanent_city']}</p>}
            </div>

            {/* Barangay */}
            <div>
              <Label htmlFor="permanent_barangay">Barangay</Label>
              <SingleComboBox
                items={permanentBarangays}
                placeholder="Select one"
                name="barangay"
                id="permanent_barangay"
                onChange={(value => setData('permanent_barangay', value))}
                invalidMessage={errors['personalInformation.permanent_barangay']}
                width="w-full"
                className="w-full"
                value={data.permanent_barangay}
                disabled={data.isResidenceSameWithPermanentAddress}
              />
              {errors['personalInformation.permanent_barangay'] && <p className="text-red-500 text-xs mt-1">{errors['personalInformation.permanent_barangay']}</p>}
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* House No. */}
            <div>
              <Label htmlFor="permanent_house_no">House No.</Label>  
              <TextInput 
                name="permanent_house_no" 
                onChange={(e => setData('permanent_house_no', e.target.value))}
                isInvalid={errors['personalInformation.permanent_house_no']}
                id="permanent_house_no"
                value={data.permanent_house_no}
                disabled={data.isResidenceSameWithPermanentAddress}
              />
              {errors['personalInformation.permanent_house_no'] && <p className="text-red-500 text-xs mt-1">{errors['personalInformation.permanent_house_no']}</p>}
            </div>

            {/* Street */}
            <div>
              <Label htmlFor="permanent_street">Street</Label>
              <TextInput 
                name="permanent_street" 
                onChange={(e => setData('permanent_street', e.target.value))}
                isInvalid={errors['personalInformation.permanent_street']}
                id="permanent_street"
                value={data.permanent_street}
                disabled={data.isResidenceSameWithPermanentAddress}
              />
              {errors['personalInformation.permanent_street'] && <p className="text-red-500 text-xs mt-1">{errors['personalInformation.permanent_street']}</p>}
            </div>

            {/* Subdivision/Village */}
            <div>
              <Label htmlFor="permanent_subdivision">Subdivision/Village</Label>
              <TextInput 
                name="permanent_subdivision" 
                onChange={(e => setData('permanent_subdivision', e.target.value))}
                isInvalid={errors['personalInformation.permanent_subdivision']}
                id="permanent_subdivision"
                value={data.permanent_subdivision}
                disabled={data.isResidenceSameWithPermanentAddress}
              />
              {errors['personalInformation.permanent_subdivision'] && <p className="text-red-500 text-xs mt-1">{errors['personalInformation.permanent_subdivision']}</p>}
            </div>

            {/* Zip */}
            <div>
              <Label htmlFor="permanent_zip">Zip Code</Label>
              <TextInput 
                name="permanent_zip" 
                onChange={(e => setData('permanent_zip', e.target.value))}
                isInvalid={errors['personalInformation.permanent_zip']}
                id="permanent_zip"
                value={data.permanent_zip}
                disabled={data.isResidenceSameWithPermanentAddress}
              />
              {errors['personalInformation.permanent_zip'] && <p className="text-red-500 text-xs mt-1">{errors['personalInformation.permanent_zip']}</p>}
            </div>
          </div>
        </Fieldset>
        )}
      </CardContent>
      
    </Card>
  )
}

export default PersonalInformation