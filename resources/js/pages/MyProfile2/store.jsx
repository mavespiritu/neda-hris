import { create } from "zustand"
import {
  getCountries,
  getProvinces,
  getMunicipalities,
  getBarangays,
  getDistricts,
  getPdsSection,
  savePdsSection,
} from "./api"

const mapOptions = (rows = []) =>
  rows
    .map((row) => ({
      label: row.name,
      value: row.code,
    }))
    .sort((a, b) => a.label.localeCompare(b.label))

const _personalInformation = {
  last_name: "",
  first_name: "",
  middle_name: "",
  ext_name: "",
  birth_date: "",
  birth_place: "",
  gender: "",
  civil_status: "",
  height: "",
  weight: "",
  blood_type: "",
  gsis_no: "",
  umid_no: "",
  pag_ibig_no: "",
  philhealth_no: "",
  sss_no: "",
  tin_no: "",
  philsys_no: "",
  agency_employee_no: "",
  citizenship: "",
  citizenship_by: "",
  citizenship_country: "",
  isResidenceSameWithPermanentAddress: false,
  permanent_house_no: "",
  permanent_street: "",
  permanent_subdivision: "",
  permanent_barangay: "",
  permanent_city: "",
  permanent_province: "",
  permanent_district: "",
  permanent_is_metro_manila: false,
  permanent_zip: "",
  residential_house_no: "",
  residential_street: "",
  residential_subdivision: "",
  residential_barangay: "",
  residential_city: "",
  residential_province: "",
  residential_district: "",
  residential_is_metro_manila: false,
  residential_zip: "",
  telephone_no: "",
  mobile_no: "",
  email_address: "",
}

const _familyBackground = {
  isThereSpouse: false,
  spouse: {
    hasSpouse: false,
    last_name: "",
    first_name: "",
    middle_name: "",
    ext_name: "",
    occupation: "",
    employer_name: "",
    business_address: "",
    telephone_no: "",
  },
  father: {
    last_name: "",
    first_name: "",
    middle_name: "",
    ext_name: "",
    birth_date: "",
  },
  mother: {
    last_name: "",
    first_name: "",
    middle_name: "",
    maiden_name: "",
    birth_date: "",
  },
  children: [],
}

const _educationalBackground = {
    elementary: [],
    secondary: [],
    vocational: [],
    college: [],
    graduate: [],
}

const _civilServiceEligibility = []
const _workExperience = []
const _voluntaryWork = []
const _learningAndDevelopment = []

const _otherInformation = {
  skills: [],
  recognitions: [],
  memberships: [],
  questions: [
      {
          item_no: '34',
          list: '',
          question: "Are you related by consanguinity or affinity to the appointing or recommending authority, or to the chief of bureau or office or to the person who has immediate supervision over you in the Office, Bureau or Department where you will be apppointed,",
          isAnswerable: false,
          subQuestions: [
              {
                  item_no: '34',
                  list: 'A',
                  question: "within the third degree?",
                  isAnswerable: true,
                  answer: "no",
                  question_details: "If YES, give details",
                  details: ""
              },
              {
                  item_no: '34',
                  list: 'B',
                  question: "within the fourth degree (for Local Government Unit - Career Employees)?",
                  isAnswerable: true,
                  answer: "no",
                  question_details: "If YES, give details",
                  details: ""
              }
          ]
      },
      {
          item_no: '35',
          list: '',
          question: "",
          isAnswerable: false,
          subQuestions: [
              {
                  item_no: '35',
                  list: 'A',
                  question: "Have you ever been found guilty of any administrative offense?",
                  isAnswerable: true,
                  answer: "no",
                  question_details: "If YES, give details",
                  details: ""
              },
              {
                  item_no: '35',
                  list: 'B',
                  question: "Have you been criminally charged before any court?",
                  isAnswerable: true,
                  answer: "no",
                  question_details: "If YES, give the date of filing and the status of case/s",
                  details: ""
              }
          ]
      },
      {
          item_no: '36',
          list: '',
          question: "Have you ever been convicted of any crime or violation of any law, decree, ordinance or regulation by any court or tribunal?",
          isAnswerable: true,
          answer: "no",
          question_details: "If YES, give details",
          details: ""
      },
      {
          item_no: '37',
          list: '',
          question: "Have you ever been separated from the service in any of the following modes: resignation, retirement, dropped from the rolls, dismissal, termination, end of term, finished contract or phased out (abolition) in the public or private sector?",
          isAnswerable: true,
          answer: "no",
          question_details: "If YES, give details",
          details: ""
      },
      {
          item_no: '38',
          list: '',
          question: "",
          isAnswerable: false,
          subQuestions: [
              {
                  item_no: '38',
                  list: 'A',
                  question: "Have you ever been a candidate in a national or local election held within the last year (except Barangay election)?",
                  isAnswerable: true,
                  answer: "no",
                  question_details: "If YES, give details",
                  details: ""
              },
              {
                  item_no: '38',
                  list: 'B',
                  question: "Have you resigned from the government service during the three (3)-month period before the last election to promote/actively campaign for a national or local candidate?",
                  isAnswerable: true,
                  answer: "no",
                  question_details: "If YES, give details (country)",
                  details: ""
              }
          ]
      },
      {
          item_no: '39',
          list: '',
          question: "Have you acquired the status of an immigrant or permanent resident of another country?",
          isAnswerable: true,
          answer: "no",
          question_details: "If YES, give details",
          details: ""
      },
      {
          item_no: '40',
          list: '',
          question: "Pursuant to: (a) Indigenous People's Act (RA 8371) (b) Magna Carta for Disabled Persons (RA 7277) and (c) Solo Parents Welfare Act of 2000 (RA 8972), please answer the following items:",
          isAnswerable: false,
          subQuestions: [
              {
                  item_no: '40',
                  list: 'A',
                  question: "Are you a member of any indigenous group?",
                  isAnswerable: true,
                  answer: "no",
                  question_details: "If YES, please specify",
                  details: ""
              },
              {
                  item_no: '40',
                  list: 'B',
                  question: "Are you a person with disability?",
                  isAnswerable: true,
                  answer: "no",
                  question_details: "If YES, please specify ID No.",
                  details: ""
              },
              {
                  item_no: '40',
                  list: 'C',
                  question: "Are you a solo parent?",
                  isAnswerable: true,
                  answer: "no",
                  question_details: "If YES, please specify ID No.",
                  details: ""
              }
          ]
      },
  ],
  references: [
    {
      name: "",
      address: "",
      contact_no: "",
    },
    {
      name: "",
      address: "",
      contact_no: "",
    },
    {
      name: "",
      address: "",
      contact_no: "",
    },
  ]
}

const store = create((set, get) => ({
  loading: false,

  pdsState: {
    personalInformation: _personalInformation,
    familyBackground: _familyBackground,
    educationalBackground: _educationalBackground,
    civilServiceEligibility: _civilServiceEligibility,
    workExperience: _workExperience,
    voluntaryWork: _voluntaryWork,
    learningAndDevelopment: _learningAndDevelopment,
    otherInformation: _otherInformation,
  },

  validationErrors: {},
 clearValidationErrors: () => set({ validationErrors: {} }),

  setPdsSection: (section, data) =>
    set((state) => ({
      pdsState: {
        ...state.pdsState,
        [section]: {
          ...(state.pdsState[section] || {}),
          ...data,
        },
      },
    })),

  setPdsField: (section, field, value) =>
    set((state) => ({
      pdsState: {
        ...state.pdsState,
        [section]: {
          ...(state.pdsState[section] || {}),
          [field]: value,
        },
      },
    })),

  fetchPdsSection: async (section, payload = {}) => {
  set({ loading: true })

  try {
    const response = await getPdsSection(section, payload)
    const sectionData = response.data

    set((state) => ({
      pdsState: {
        ...state.pdsState,
        [section]: Array.isArray(sectionData)
          ? sectionData
          : {
              ...(state.pdsState[section] || {}),
              ...sectionData,
            },
      },
      loading: false,
    }))
  } catch (error) {
    console.error(`Failed to fetch ${section}:`, error)
    set({ loading: false })
    throw error
  }
  },


  savePdsSection: async (section, payload = {}) => {
    set({ loading: true })

    try {
      const sectionData = get().pdsState[section] || {}

      const response = await savePdsSection(section, {
        ...sectionData,
        ...payload,
      })

      set({ loading: false, validationErrors: {} })
      return { ok: true, response }
    } catch (error) {
      const errors = error.response?.data?.errors || {}

      set({
        loading: false,
        validationErrors: errors,
      })

      return { ok: false, errors, error }
    }
  },

  countriesState: {
    countries: [],
    loading: false,
    error: null,
    fetchCountries: async () => {
      set((state) => ({
        countriesState: {
          ...state.countriesState,
          loading: true,
          error: null,
        },
      }))

      try {
        const response = await getCountries()

        const countryData = response.data.data
          ?.filter((country) => country.name !== "Philippines")
          .map((country) => ({
            label: country.name,
            value: country.name,
          }))
          .sort((a, b) => a.label.localeCompare(b.label))

        set((state) => ({
          countriesState: {
            ...state.countriesState,
            countries: countryData,
            loading: false,
          },
        }))
      } catch (error) {
        set((state) => ({
          countriesState: {
            ...state.countriesState,
            error: error.message || "Failed to fetch countries.",
            loading: false,
          },
        }))
      }
    },
  },

  permanentAddressState: {
    provinces: [],
    districts: [],
    citymuns: [],
    barangays: [],
    provincesLoading: false,
    districtsLoading: false,
    citymunsLoading: false,
    barangaysLoading: false,
    provincesError: null,
    districtsError: null,
    citymunsError: null,
    barangaysError: null,

    fetchProvinces: async () => {
      set((state) => ({
        permanentAddressState: {
          ...state.permanentAddressState,
          provincesLoading: true,
          provincesError: null,
        },
      }))

      try {
        const response = await getProvinces()
        set((state) => ({
          permanentAddressState: {
            ...state.permanentAddressState,
            provinces: mapOptions(response.data),
            provincesLoading: false,
          },
        }))
      } catch (error) {
        set((state) => ({
          permanentAddressState: {
            ...state.permanentAddressState,
            provincesError: error.message || "Failed to fetch provinces.",
            provincesLoading: false,
          },
        }))
      }
    },

    fetchDistricts: async () => {
      set((state) => ({
        permanentAddressState: {
          ...state.permanentAddressState,
          districtsLoading: true,
          districtsError: null,
        },
      }))

      try {
        const response = await getDistricts()
        set((state) => ({
          permanentAddressState: {
            ...state.permanentAddressState,
            districts: mapOptions(response.data),
            districtsLoading: false,
          },
        }))
      } catch (error) {
        set((state) => ({
          permanentAddressState: {
            ...state.permanentAddressState,
            districtsError: error.message || "Failed to fetch districts.",
            districtsLoading: false,
          },
        }))
      }
    },

    fetchCitymuns: async ({ provinceCode = null, districtCode = null }) => {
      set((state) => ({
        permanentAddressState: {
          ...state.permanentAddressState,
          citymunsLoading: true,
          citymunsError: null,
          citymuns: [],
        },
      }))

      try {
        const response = await getMunicipalities({ provinceCode, districtCode })
        set((state) => ({
          permanentAddressState: {
            ...state.permanentAddressState,
            citymuns: mapOptions(response.data),
            citymunsLoading: false,
          },
        }))
      } catch (error) {
        set((state) => ({
          permanentAddressState: {
            ...state.permanentAddressState,
            citymunsError: error.message || "Failed to fetch city/municipalities.",
            citymunsLoading: false,
          },
        }))
      }
    },

    fetchBarangays: async (cityOrMunicipalityCode) => {
      set((state) => ({
        permanentAddressState: {
          ...state.permanentAddressState,
          barangaysLoading: true,
          barangaysError: null,
          barangays: [],
        },
      }))

      try {
        const response = await getBarangays({ cityOrMunicipalityCode })
        set((state) => ({
          permanentAddressState: {
            ...state.permanentAddressState,
            barangays: mapOptions(response.data),
            barangaysLoading: false,
          },
        }))
      } catch (error) {
        set((state) => ({
          permanentAddressState: {
            ...state.permanentAddressState,
            barangaysError: error.message || "Failed to fetch barangays.",
            barangaysLoading: false,
          },
        }))
      }
    },
  },

  residentialAddressState: {
    provinces: [],
    districts: [],
    citymuns: [],
    barangays: [],
    provincesLoading: false,
    districtsLoading: false,
    citymunsLoading: false,
    barangaysLoading: false,
    provincesError: null,
    districtsError: null,
    citymunsError: null,
    barangaysError: null,

    fetchProvinces: async () => {
      set((state) => ({
        residentialAddressState: {
          ...state.residentialAddressState,
          provincesLoading: true,
          provincesError: null,
        },
      }))

      try {
        const response = await getProvinces()
        set((state) => ({
          residentialAddressState: {
            ...state.residentialAddressState,
            provinces: mapOptions(response.data),
            provincesLoading: false,
          },
        }))
      } catch (error) {
        set((state) => ({
          residentialAddressState: {
            ...state.residentialAddressState,
            provincesError: error.message || "Failed to fetch provinces.",
            provincesLoading: false,
          },
        }))
      }
    },

    fetchDistricts: async () => {
      set((state) => ({
        residentialAddressState: {
          ...state.residentialAddressState,
          districtsLoading: true,
          districtsError: null,
        },
      }))

      try {
        const response = await getDistricts()
        set((state) => ({
          residentialAddressState: {
            ...state.residentialAddressState,
            districts: mapOptions(response.data),
            districtsLoading: false,
          },
        }))
      } catch (error) {
        set((state) => ({
          residentialAddressState: {
            ...state.residentialAddressState,
            districtsError: error.message || "Failed to fetch districts.",
            districtsLoading: false,
          },
        }))
      }
    },

    fetchCitymuns: async ({ provinceCode = null, districtCode = null }) => {
      set((state) => ({
        residentialAddressState: {
          ...state.residentialAddressState,
          citymunsLoading: true,
          citymunsError: null,
          citymuns: [],
        },
      }))

      try {
        const response = await getMunicipalities({ provinceCode, districtCode })
        set((state) => ({
          residentialAddressState: {
            ...state.residentialAddressState,
            citymuns: mapOptions(response.data),
            citymunsLoading: false,
          },
        }))
      } catch (error) {
        set((state) => ({
          residentialAddressState: {
            ...state.residentialAddressState,
            citymunsError: error.message || "Failed to fetch city/municipalities.",
            citymunsLoading: false,
          },
        }))
      }
    },

    fetchBarangays: async (cityOrMunicipalityCode) => {
      set((state) => ({
        residentialAddressState: {
          ...state.residentialAddressState,
          barangaysLoading: true,
          barangaysError: null,
          barangays: [],
        },
      }))

      try {
        const response = await getBarangays({ cityOrMunicipalityCode })
        set((state) => ({
          residentialAddressState: {
            ...state.residentialAddressState,
            barangays: mapOptions(response.data),
            barangaysLoading: false,
          },
        }))
      } catch (error) {
        set((state) => ({
          residentialAddressState: {
            ...state.residentialAddressState,
            barangaysError: error.message || "Failed to fetch barangays.",
            barangaysLoading: false,
          },
        }))
      }
    },
  },
}))

export default store
