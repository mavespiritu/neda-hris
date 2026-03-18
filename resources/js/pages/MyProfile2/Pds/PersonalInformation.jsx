import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import DatePicker from "@/components/DatePicker"
import { Fieldset } from "@/components/Fieldset"
import store from "../store"
import { UserPen, Loader2 } from "lucide-react"
import SingleComboBox from "@/components/SingleComboBox"
import { Switch } from "@/components/ui/switch"
import { useEffect } from "react"
import TextInput from "@/components/TextInput"
import AmountInput from "@/components/AmountInput"
import { genders, civilStatuses, bloodTypes, citizenships, citizenshipsBy } from "../selections.jsx"

const PersonalInformation = ({
  applicantId,
  profileType,
  section = "personalInformation",
  errors = {},
}) => {
  const {
    loading,
    pdsState,
    fetchPdsSection,
    setPdsField,
    countriesState: { countries, fetchCountries },
    permanentAddressState: {
      fetchProvinces: fetchPermanentProvinces,
      fetchDistricts: fetchPermanentDistricts,
      fetchCitymuns: fetchPermanentCitymuns,
      fetchBarangays: fetchPermanentBarangays,
      provinces: permanentProvinces,
      districts: permanentDistricts,
      citymuns: permanentCitymuns,
      barangays: permanentBarangays,
      provincesLoading: permanentProvincesLoading,
      districtsLoading: permanentDistrictsLoading,
      citymunsLoading: permanentCitymunsLoading,
      barangaysLoading: permanentBarangaysLoading,
    },
    residentialAddressState: {
      fetchProvinces: fetchResidentialProvinces,
      fetchDistricts: fetchResidentialDistricts,
      fetchCitymuns: fetchResidentialCitymuns,
      fetchBarangays: fetchResidentialBarangays,
      provinces: residentialProvinces,
      districts: residentialDistricts,
      citymuns: residentialCitymuns,
      barangays: residentialBarangays,
      provincesLoading: residentialProvincesLoading,
      districtsLoading: residentialDistrictsLoading,
      citymunsLoading: residentialCitymunsLoading,
      barangaysLoading: residentialBarangaysLoading,
    },
  } = store()

  const data = pdsState.personalInformation || {}

  const setData = (field, value) => {
    setPdsField("personalInformation", field, value)
  }

  const findLabel = (items = [], value) => items.find((item) => item.value === value)?.label || ""

  useEffect(() => {
    fetchPdsSection(section, { applicantId, profileType })
    fetchCountries()
    fetchPermanentProvinces()
    fetchPermanentDistricts()
    fetchResidentialProvinces()
    fetchResidentialDistricts()
  }, [applicantId, profileType, section])

  useEffect(() => {
    if (data.residential_province && !data.residential_is_metro_manila) {
      const label = findLabel(residentialProvinces, data.residential_province)
      if (label && data.residential_province_name !== label) {
        setData("residential_province_name", label)
      }
    }
  }, [data.residential_province, data.residential_is_metro_manila, residentialProvinces])

  useEffect(() => {
    if (data.residential_district && data.residential_is_metro_manila) {
      const label = findLabel(residentialDistricts, data.residential_district)
      if (label && data.residential_district_name !== label) {
        setData("residential_district_name", label)
      }
    }
  }, [data.residential_district, data.residential_is_metro_manila, residentialDistricts])

  useEffect(() => {
    if (data.residential_city) {
      const label = findLabel(residentialCitymuns, data.residential_city)
      if (label && data.residential_city_name !== label) {
        setData("residential_city_name", label)
      }
    }
  }, [data.residential_city, residentialCitymuns])

  useEffect(() => {
    if (data.residential_barangay) {
      const label = findLabel(residentialBarangays, data.residential_barangay)
      if (label && data.residential_barangay_name !== label) {
        setData("residential_barangay_name", label)
      }
    }
  }, [data.residential_barangay, residentialBarangays])

  useEffect(() => {
    if (data.permanent_province && !data.permanent_is_metro_manila) {
      const label = findLabel(permanentProvinces, data.permanent_province)
      if (label && data.permanent_province_name !== label) {
        setData("permanent_province_name", label)
      }
    }
  }, [data.permanent_province, data.permanent_is_metro_manila, permanentProvinces])

  useEffect(() => {
    if (data.permanent_district && data.permanent_is_metro_manila) {
      const label = findLabel(permanentDistricts, data.permanent_district)
      if (label && data.permanent_district_name !== label) {
        setData("permanent_district_name", label)
      }
    }
  }, [data.permanent_district, data.permanent_is_metro_manila, permanentDistricts])

  useEffect(() => {
    if (data.permanent_city) {
      const label = findLabel(permanentCitymuns, data.permanent_city)
      if (label && data.permanent_city_name !== label) {
        setData("permanent_city_name", label)
      }
    }
  }, [data.permanent_city, permanentCitymuns])

  useEffect(() => {
    if (data.permanent_barangay) {
      const label = findLabel(permanentBarangays, data.permanent_barangay)
      if (label && data.permanent_barangay_name !== label) {
        setData("permanent_barangay_name", label)
      }
    }
  }, [data.permanent_barangay, permanentBarangays])

  useEffect(() => {
    if (data.permanent_is_metro_manila && data.permanent_district) {
      fetchPermanentCitymuns({ districtCode: data.permanent_district })
    } else if (data.permanent_province) {
      fetchPermanentCitymuns({ provinceCode: data.permanent_province })
    }
  }, [data.permanent_province, data.permanent_district, data.permanent_is_metro_manila])

  useEffect(() => {
    if (data.residential_is_metro_manila && data.residential_district) {
      fetchResidentialCitymuns({ districtCode: data.residential_district })
    } else if (data.residential_province) {
      fetchResidentialCitymuns({ provinceCode: data.residential_province })
    }
  }, [data.residential_province, data.residential_district, data.residential_is_metro_manila])

  useEffect(() => {
    if (data.permanent_city) fetchPermanentBarangays(data.permanent_city)
  }, [data.permanent_city])

  useEffect(() => {
    if (data.residential_city) fetchResidentialBarangays(data.residential_city)
  }, [data.residential_city])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-semibold text-lg flex items-center">
          <UserPen className="mr-2 h-4 w-4" /> Personal Information
        </CardTitle>
      </CardHeader>

      <CardContent className="relative">
        {loading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center rounded-md bg-white/50 backdrop-blur-[2px]">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        <div className={`${loading ? "pointer-events-none blur-[1.5px] opacity-70" : ""} flex flex-col gap-4 transition`}>
          <Fieldset legend="Basic Information" className="bg-muted">
            <div className="grid grid-cols-1 lg:grid-cols-[28%_28%_28%_auto] gap-4">
              <div>
                <Label htmlFor="last_name">Last Name</Label>
                <TextInput
                  name="last_name"
                  onChange={(e) => setData("last_name", e.target.value)}
                  isInvalid={errors["last_name"]}
                  id="last_name"
                  value={data.last_name || ""}
                />
                {errors["last_name"] && (
                  <p className="text-red-500 text-xs mt-1">{errors["last_name"]}</p>
                )}
              </div>

              <div>
                <Label htmlFor="first_name">First Name</Label>
                <TextInput
                  name="first_name"
                  onChange={(e) => setData("first_name", e.target.value)}
                  isInvalid={errors["first_name"]}
                  id="first_name"
                  value={data.first_name || ""}
                />
                {errors["first_name"] && (
                  <p className="text-red-500 text-xs mt-1">{errors["first_name"]}</p>
                )}
              </div>

              <div>
                <Label htmlFor="middle_name">Middle Name</Label>
                <TextInput
                  name="middle_name"
                  onChange={(e) => setData("middle_name", e.target.value)}
                  isInvalid={errors["middle_name"]}
                  id="middle_name"
                  value={data.middle_name || ""}
                />
                {errors["middle_name"] && (
                  <p className="text-red-500 text-xs mt-1">{errors["middle_name"]}</p>
                )}
              </div>

              <div>
                <Label htmlFor="ext_name">Suffix</Label>
                <TextInput
                  name="ext_name"
                  onChange={(e) => setData("ext_name", e.target.value)}
                  isInvalid={errors["ext_name"]}
                  id="ext_name"
                  value={data.ext_name || ""}
                />
                {errors["ext_name"] && (
                  <p className="text-red-500 text-xs mt-1">{errors["ext_name"]}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="birth_date">Date of Birth</Label>
                <DatePicker
                  placeholder="Select a date"
                  onDateChange={(date) => setData("birth_date", date)}
                  value={data.birth_date || ""}
                  invalidMessage={errors["birth_date"]}
                />
              </div>

              <div>
                <Label htmlFor="birth_place">Place of Birth</Label>
                <TextInput
                  name="birth_place"
                  onChange={(e) => setData("birth_place", e.target.value)}
                  isInvalid={errors["birth_place"]}
                  id="birth_place"
                  value={data.birth_place || ""}
                />
                {errors["birth_place"] && (
                  <p className="text-red-500 text-xs mt-1">{errors["birth_place"]}</p>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="gender">Sex</Label>
                  <SingleComboBox
                    items={genders}
                    placeholder="Select one"
                    name="gender"
                    id="gender"
                    onChange={(value) => setData("gender", value)}
                    invalidMessage={errors["gender"]}
                    width="w-full"
                    className="w-full"
                    value={data.gender || ""}
                  />
                  {errors["gender"] && (
                    <p className="text-red-500 text-xs mt-1">{errors["gender"]}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="civil_status">Civil Status</Label>
                  <SingleComboBox
                    items={civilStatuses}
                    placeholder="Select one"
                    name="civil_status"
                    id="civil_status"
                    onChange={(value) => setData("civil_status", value)}
                    invalidMessage={errors["civil_status"]}
                    width="w-full"
                    className="w-full"
                    value={data.civil_status || ""}
                  />
                  {errors["civil_status"] && (
                    <p className="text-red-500 text-xs mt-1">{errors["civil_status"]}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="height">Height (in m.)</Label>
                <AmountInput
                  name="height"
                  onChange={(e) => setData("height", e.target.value)}
                  isInvalid={errors["height"]}
                  id="height"
                  value={data.height || ""}
                  placeholder="Height in meters"
                />
                {errors["height"] && (
                  <p className="text-red-500 text-xs mt-1">{errors["height"]}</p>
                )}
              </div>

              <div>
                <Label htmlFor="weight">Weight (in kg.)</Label>
                <AmountInput
                  name="weight"
                  onChange={(e) => setData("weight", e.target.value)}
                  isInvalid={errors["weight"]}
                  id="weight"
                  value={data.weight || ""}
                  placeholder="Weight in kilograms"
                />
                {errors["weight"] && (
                  <p className="text-red-500 text-xs mt-1">{errors["weight"]}</p>
                )}
              </div>

              <div>
                <Label htmlFor="blood_type">Blood Type</Label>
                <SingleComboBox
                  items={bloodTypes}
                  placeholder="Select one"
                  name="blood_type"
                  id="blood_type"
                  onChange={(value) => setData("blood_type", value)}
                  invalidMessage={errors["blood_type"]}
                  width="w-full"
                  className="w-full"
                  value={data.blood_type || ""}
                />
                {errors["blood_type"] && (
                  <p className="text-red-500 text-xs mt-1">{errors["blood_type"]}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="gsis_no">UMID No.</Label>
                <TextInput
                  name="umid_no"
                  onChange={(e) => setData("umid_no", e.target.value)}
                  isInvalid={errors["umid_no"]}
                  id="umid_no"
                  value={data.umid_no || ""}
                />
                {errors["umid_no"] && (
                  <p className="text-red-500 text-xs mt-1">{errors["umid_no"]}</p>
                )}
              </div>
              <div>
                <Label htmlFor="pag_ibig_no">PAG-IBIG No.</Label>
                <TextInput
                  name="pag_ibig_no"
                  onChange={(e) => setData("pag_ibig_no", e.target.value)}
                  isInvalid={errors["pag_ibig_no"]}
                  id="pag_ibig_no"
                  value={data.pag_ibig_no || ""}
                />
                {errors["pag_ibig_no"] && (
                  <p className="text-red-500 text-xs mt-1">{errors["pag_ibig_no"]}</p>
                )}
              </div>

              <div>
                <Label htmlFor="philhealth_no">PhilHealth No.</Label>
                <TextInput
                  name="philhealth_no"
                  onChange={(e) => setData("philhealth_no", e.target.value)}
                  isInvalid={errors["philhealth_no"]}
                  id="philhealth_no"
                  value={data.philhealth_no || ""}
                />
                {errors["philhealth_no"] && (
                  <p className="text-red-500 text-xs mt-1">{errors["philhealth_no"]}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              

              <div>
                <Label htmlFor="philsys_no">Philsys No. (PSN)</Label>
                <TextInput
                  name="philsys_no"
                  onChange={(e) => setData("philsys_no", e.target.value)}
                  isInvalid={errors["philsys_no"]}
                  id="philsys_no"
                  value={data.philsys_no || ""}
                />
                {errors["philsys_no"] && (
                  <p className="text-red-500 text-xs mt-1">{errors["philsys_no"]}</p>
                )}
              </div>

              <div>
                <Label htmlFor="tin_no">TIN</Label>
                <TextInput
                  name="tin_no"
                  onChange={(e) => setData("tin_no", e.target.value)}
                  isInvalid={errors["tin_no"]}
                  id="tin_no"
                  value={data.tin_no || ""}
                />
                {errors["tin_no"] && (
                  <p className="text-red-500 text-xs mt-1">{errors["tin_no"]}</p>
                )}
              </div>

              <div>
                <Label htmlFor="agency_employee_no">Agency Employee No.</Label>
                <TextInput
                  name="agency_employee_no"
                  onChange={(e) => setData("agency_employee_no", e.target.value)}
                  isInvalid={errors["agency_employee_no"]}
                  id="agency_employee_no"
                  value={data.agency_employee_no || ""}
                />
                {errors["agency_employee_no"] && (
                  <p className="text-red-500 text-xs mt-1">{errors["agency_employee_no"]}</p>
                )}
              </div>
            </div>

            

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="citizenship">Citizenship</Label>
                <SingleComboBox
                  items={citizenships}
                  placeholder="Select one"
                  name="citizenship"
                  id="citizenship"
                  onChange={(value) => setData("citizenship", value)}
                  invalidMessage={errors["citizenship"]}
                  width="w-full"
                  className="w-full"
                  value={data.citizenship || ""}
                />
                {errors["citizenship"] && (
                  <p className="text-red-500 text-xs mt-1">{errors["citizenship"]}</p>
                )}
              </div>

              <div>
                <Label htmlFor="citizenship_by">Citizenship By</Label>
                <SingleComboBox
                  items={citizenshipsBy}
                  placeholder="Select one"
                  name="citizenship_by"
                  id="citizenship_by"
                  onChange={(value) => setData("citizenship_by", value)}
                  invalidMessage={errors["citizenship_by"]}
                  width="w-full"
                  className="w-full"
                  value={data.citizenship_by || ""}
                  disabled={data.citizenship === "Filipino" || data.citizenship === ""}
                />
                {errors["citizenship_by"] && (
                  <p className="text-red-500 text-xs mt-1">{errors["citizenship_by"]}</p>
                )}
              </div>

              <div>
                <Label htmlFor="citizenship_country">If holder of dual citizenship, indicate country</Label>
                <SingleComboBox
                  items={countries}
                  placeholder="Select one"
                  name="country"
                  id="citizenship_country"
                  onChange={(value) => setData("citizenship_country", value)}
                  invalidMessage={errors["citizenship_country"]}
                  width="w-full"
                  className="w-full"
                  value={data.citizenship_country || ""}
                  disabled={data.citizenship === "Filipino" || data.citizenship === ""}
                />
                {errors["citizenship_country"] && (
                  <p className="text-red-500 text-xs mt-1">{errors["citizenship_country"]}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="telephone_no">Telephone No.</Label>
                <TextInput
                  name="telephone_no"
                  onChange={(e) => setData("telephone_no", e.target.value)}
                  isInvalid={errors["telephone_no"]}
                  id="telephone_no"
                  value={data.telephone_no || ""}
                />
                {errors["telephone_no"] && (
                  <p className="text-red-500 text-xs mt-1">{errors["telephone_no"]}</p>
                )}
              </div>

              <div>
                <Label htmlFor="mobile_no">Mobile No.</Label>
                <TextInput
                  name="mobile_no"
                  onChange={(e) => setData("mobile_no", e.target.value)}
                  isInvalid={errors["mobile_no"]}
                  id="mobile_no"
                  value={data.mobile_no || ""}
                />
                {errors["mobile_no"] && (
                  <p className="text-red-500 text-xs mt-1">{errors["mobile_no"]}</p>
                )}
              </div>

              <div>
                <Label htmlFor="email_address">Email Address</Label>
                <TextInput
                  name="email_address"
                  onChange={(e) => setData("email_address", e.target.value)}
                  isInvalid={errors["email_address"]}
                  id="email_address"
                  value={data.email_address || ""}
                />
                {errors["email_address"] && (
                  <p className="text-red-500 text-xs mt-1">{errors["email_address"]}</p>
                )}
              </div>
            </div>
          </Fieldset>

          <Fieldset legend="Residential Address" className="bg-muted">
            <Switch
              checked={!!data.residential_is_metro_manila}
              onCheckedChange={(checked) => {
                setData("residential_is_metro_manila", checked)
                setData("residential_province", "")
                setData("residential_province_name", "")
                setData("residential_district", "")
                setData("residential_district_name", "")
                setData("residential_city", "")
                setData("residential_city_name", "")
                setData("residential_barangay", "")
                setData("residential_barangay_name", "")
              }}
            />
            <span className="text-sm font-medium ml-2">Is this address in Metro Manila?</span>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div>
                <Label htmlFor={data.residential_is_metro_manila ? "residential_district" : "residential_province"}>
                  {data.residential_is_metro_manila ? "District" : "Province"}
                </Label>
                <SingleComboBox
                  items={data.residential_is_metro_manila ? residentialDistricts : residentialProvinces}
                  placeholder={
                    data.residential_is_metro_manila
                      ? (residentialDistrictsLoading ? "Loading districts..." : "Select one")
                      : (residentialProvincesLoading ? "Loading provinces..." : "Select one")
                  }
                  name={data.residential_is_metro_manila ? "district" : "province"}
                  id={data.residential_is_metro_manila ? "residential_district" : "residential_province"}
                  onChange={(value) => {
                    if (data.residential_is_metro_manila) {
                      setData("residential_district", value)
                      setData("residential_district_name", findLabel(residentialDistricts, value))
                      setData("residential_province", "")
                      setData("residential_province_name", "")
                    } else {
                      setData("residential_province", value)
                      setData("residential_province_name", findLabel(residentialProvinces, value))
                      setData("residential_district", "")
                      setData("residential_district_name", "")
                    }
                    setData("residential_city", "")
                    setData("residential_city_name", "")
                    setData("residential_barangay", "")
                    setData("residential_barangay_name", "")
                  }}
                  invalidMessage={
                    data.residential_is_metro_manila
                      ? errors["residential_district"]
                      : errors["residential_province"]
                  }
                  width="w-full"
                  className="w-full"
                  value={data.residential_is_metro_manila ? (data.residential_district || "") : (data.residential_province || "")}
                />
                {data.residential_is_metro_manila
                  ? errors["residential_district"] && (
                      <p className="text-red-500 text-xs mt-1">{errors["residential_district"]}</p>
                    )
                  : errors["residential_province"] && (
                      <p className="text-red-500 text-xs mt-1">{errors["residential_province"]}</p>
                    )}
              </div>

              <div>
                <Label htmlFor="residential_city">City/Municipality</Label>
                <SingleComboBox
                  items={residentialCitymuns}
                  placeholder={residentialCitymunsLoading ? "Loading cities/municipalities..." : "Select one"}
                  name="city/municipality"
                  id="residential_city"
                  onChange={(value) => {
                    setData("residential_city", value)
                    setData("residential_city_name", findLabel(residentialCitymuns, value))
                    setData("residential_barangay", "")
                    setData("residential_barangay_name", "")
                  }}
                  invalidMessage={errors["residential_city"]}
                  width="w-full"
                  className="w-full"
                  value={data.residential_city || ""}
                  disabled={
                    data.residential_is_metro_manila
                      ? !data.residential_district
                      : !data.residential_province
                  }
                />
                {errors["residential_city"] && (
                  <p className="text-red-500 text-xs mt-1">{errors["residential_city"]}</p>
                )}
              </div>

              <div>
                <Label htmlFor="residential_barangay">Barangay</Label>
                <SingleComboBox
                  items={residentialBarangays}
                  placeholder={residentialBarangaysLoading ? "Loading barangays..." : "Select one"}
                  name="barangay"
                  id="residential_barangay"
                  onChange={(value) => {
                    setData("residential_barangay", value)
                    setData("residential_barangay_name", findLabel(residentialBarangays, value))
                  }}
                  invalidMessage={errors["residential_barangay"]}
                  width="w-full"
                  className="w-full"
                  value={data.residential_barangay || ""}
                  disabled={!data.residential_city}
                />
                {errors["residential_barangay"] && (
                  <p className="text-red-500 text-xs mt-1">{errors["residential_barangay"]}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="residential_house_no">House No.</Label>
                <TextInput
                  name="residential_house_no"
                  onChange={(e) => setData("residential_house_no", e.target.value)}
                  isInvalid={errors["residential_house_no"]}
                  id="residential_house_no"
                  value={data.residential_house_no || ""}
                />
                {errors["residential_house_no"] && (
                  <p className="text-red-500 text-xs mt-1">{errors["residential_house_no"]}</p>
                )}
              </div>

              <div>
                <Label htmlFor="residential_street">Street</Label>
                <TextInput
                  name="residential_street"
                  onChange={(e) => setData("residential_street", e.target.value)}
                  isInvalid={errors["residential_street"]}
                  id="residential_street"
                  value={data.residential_street || ""}
                />
                {errors["residential_street"] && (
                  <p className="text-red-500 text-xs mt-1">{errors["residential_street"]}</p>
                )}
              </div>

              <div>
                <Label htmlFor="residential_subdivision">Subdivision/Village</Label>
                <TextInput
                  name="residential_subdivision"
                  onChange={(e) => setData("residential_subdivision", e.target.value)}
                  isInvalid={errors["residential_subdivision"]}
                  id="residential_subdivision"
                  value={data.residential_subdivision || ""}
                />
                {errors["residential_subdivision"] && (
                  <p className="text-red-500 text-xs mt-1">{errors["residential_subdivision"]}</p>
                )}
              </div>

              <div>
                <Label htmlFor="residential_zip">Zip Code</Label>
                <TextInput
                  name="residential_zip"
                  onChange={(e) => setData("residential_zip", e.target.value)}
                  isInvalid={errors["residential_zip"]}
                  id="residential_zip"
                  value={data.residential_zip || ""}
                />
                {errors["residential_zip"] && (
                  <p className="text-red-500 text-xs mt-1">{errors["residential_zip"]}</p>
                )}
              </div>
            </div>
          </Fieldset>

          <div className="flex gap-4 items-center text-sm font-medium">
            <Switch
              checked={!!data.isResidenceSameWithPermanentAddress}
              onCheckedChange={(checked) => setData("isResidenceSameWithPermanentAddress", checked)}
            />
            Is residential address the same with permanent address?
          </div>

          {!data.isResidenceSameWithPermanentAddress && (
            <Fieldset legend="Permanent Address" className="bg-muted">
              <Switch
                checked={!!data.permanent_is_metro_manila}
                onCheckedChange={(checked) => {
                  setData("permanent_is_metro_manila", checked)
                  setData("permanent_province", "")
                  setData("permanent_province_name", "")
                  setData("permanent_district", "")
                  setData("permanent_district_name", "")
                  setData("permanent_city", "")
                  setData("permanent_city_name", "")
                  setData("permanent_barangay", "")
                  setData("permanent_barangay_name", "")
                }}
              />
              <span className="text-sm font-medium ml-2">Is this address in Metro Manila?</span>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor={data.permanent_is_metro_manila ? "permanent_district" : "permanent_province"}>
                    {data.permanent_is_metro_manila ? "District" : "Province"}
                  </Label>
                  <SingleComboBox
                    items={data.permanent_is_metro_manila ? permanentDistricts : permanentProvinces}
                    placeholder={
                      data.permanent_is_metro_manila
                        ? (permanentDistrictsLoading ? "Loading districts..." : "Select one")
                        : (permanentProvincesLoading ? "Loading provinces..." : "Select one")
                    }
                    name={data.permanent_is_metro_manila ? "district" : "province"}
                    id={data.permanent_is_metro_manila ? "permanent_district" : "permanent_province"}
                    onChange={(value) => {
                      if (data.permanent_is_metro_manila) {
                        setData("permanent_district", value)
                        setData("permanent_district_name", findLabel(permanentDistricts, value))
                        setData("permanent_province", "")
                        setData("permanent_province_name", "")
                      } else {
                        setData("permanent_province", value)
                        setData("permanent_province_name", findLabel(permanentProvinces, value))
                        setData("permanent_district", "")
                        setData("permanent_district_name", "")
                      }
                      setData("permanent_city", "")
                      setData("permanent_city_name", "")
                      setData("permanent_barangay", "")
                      setData("permanent_barangay_name", "")
                    }}
                    invalidMessage={
                      data.permanent_is_metro_manila
                        ? errors["permanent_district"]
                        : errors["permanent_province"]
                    }
                    width="w-full"
                    className="w-full"
                    value={data.permanent_is_metro_manila ? (data.permanent_district || "") : (data.permanent_province || "")}
                    disabled={data.isResidenceSameWithPermanentAddress}
                  />
                  {data.permanent_is_metro_manila
                    ? errors["permanent_district"] && (
                        <p className="text-red-500 text-xs mt-1">{errors["permanent_district"]}</p>
                      )
                    : errors["permanent_province"] && (
                        <p className="text-red-500 text-xs mt-1">{errors["permanent_province"]}</p>
                      )}
                </div>

                <div>
                  <Label htmlFor="permanent_city">City/Municipality</Label>
                  <SingleComboBox
                    items={permanentCitymuns}
                    placeholder={permanentCitymunsLoading ? "Loading cities/municipalities..." : "Select one"}
                    name="city/municipality"
                    id="permanent_city"
                    onChange={(value) => {
                      setData("permanent_city", value)
                      setData("permanent_city_name", findLabel(permanentCitymuns, value))
                      setData("permanent_barangay", "")
                      setData("permanent_barangay_name", "")
                    }}
                    invalidMessage={errors["permanent_city"]}
                    width="w-full"
                    className="w-full"
                    value={data.permanent_city || ""}
                    disabled={
                      data.isResidenceSameWithPermanentAddress ||
                      (data.permanent_is_metro_manila ? !data.permanent_district : !data.permanent_province)
                    }
                  />
                  {errors["permanent_city"] && (
                    <p className="text-red-500 text-xs mt-1">{errors["permanent_city"]}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="permanent_barangay">Barangay</Label>
                  <SingleComboBox
                    items={permanentBarangays}
                    placeholder={permanentBarangaysLoading ? "Loading barangays..." : "Select one"}
                    name="barangay"
                    id="permanent_barangay"
                    onChange={(value) => {
                      setData("permanent_barangay", value)
                      setData("permanent_barangay_name", findLabel(permanentBarangays, value))
                    }}
                    invalidMessage={errors["permanent_barangay"]}
                    width="w-full"
                    className="w-full"
                    value={data.permanent_barangay || ""}
                    disabled={data.isResidenceSameWithPermanentAddress || !data.permanent_city}
                  />
                  {errors["permanent_barangay"] && (
                    <p className="text-red-500 text-xs mt-1">{errors["permanent_barangay"]}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="permanent_house_no">House No.</Label>
                  <TextInput
                    name="permanent_house_no"
                    onChange={(e) => setData("permanent_house_no", e.target.value)}
                    isInvalid={errors["permanent_house_no"]}
                    id="permanent_house_no"
                    value={data.permanent_house_no || ""}
                    disabled={data.isResidenceSameWithPermanentAddress}
                  />
                  {errors["permanent_house_no"] && (
                    <p className="text-red-500 text-xs mt-1">{errors["permanent_house_no"]}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="permanent_street">Street</Label>
                  <TextInput
                    name="permanent_street"
                    onChange={(e) => setData("permanent_street", e.target.value)}
                    isInvalid={errors["permanent_street"]}
                    id="permanent_street"
                    value={data.permanent_street || ""}
                    disabled={data.isResidenceSameWithPermanentAddress}
                  />
                  {errors["permanent_street"] && (
                    <p className="text-red-500 text-xs mt-1">{errors["permanent_street"]}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="permanent_subdivision">Subdivision/Village</Label>
                  <TextInput
                    name="permanent_subdivision"
                    onChange={(e) => setData("permanent_subdivision", e.target.value)}
                    isInvalid={errors["permanent_subdivision"]}
                    id="permanent_subdivision"
                    value={data.permanent_subdivision || ""}
                    disabled={data.isResidenceSameWithPermanentAddress}
                  />
                  {errors["permanent_subdivision"] && (
                    <p className="text-red-500 text-xs mt-1">{errors["permanent_subdivision"]}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="permanent_zip">Zip Code</Label>
                  <TextInput
                    name="permanent_zip"
                    onChange={(e) => setData("permanent_zip", e.target.value)}
                    isInvalid={errors["permanent_zip"]}
                    id="permanent_zip"
                    value={data.permanent_zip || ""}
                    disabled={data.isResidenceSameWithPermanentAddress}
                  />
                  {errors["permanent_zip"] && (
                    <p className="text-red-500 text-xs mt-1">{errors["permanent_zip"]}</p>
                  )}
                </div>
              </div>
            </Fieldset>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default PersonalInformation
