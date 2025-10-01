import { create } from 'zustand'
import { format } from 'date-fns'
import { m } from 'framer-motion'
import { 
  getPds,
  getPdsSection,
  getCountries,
  getProvinces,
  getMunicipalities,
  getBarangays
} from '@/pages/MyProfile/api'

const usePdsStore = create((set, get) => ({
    toast: null,
    setToast: (toastInstance) => set({ toast: toastInstance }),
    activeFormModal: null,
    loading: false,
    progress: {},
    pdsState: {
        personalInformation: {
            last_name: "",
            first_name: "",
            middle_name: "",
            ext_name: "",
            birth_date: "",
            birth_place: "",
            gender: "",
            civil_status: "",
            height: 0,
            weight: 0,
            blood_type: "",
            gsis_no: "",
            pag_ibig_no: "",
            philhealth_no: "",
            sss_no: "",
            tin_no: "",
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
            permanent_zip: "",
            residential_house_no: "",
            residential_street: "",
            residential_subdivision: "",
            residential_barangay: "",
            residential_city: "",
            residential_province: "",
            residential_zip: "",
            telephone_no: "",
            mobile_no: "",
            email_address: ""
        },
        familyBackground: {
            spouse: {
                last_name: "",
                first_name: "",
                middle_name: "",
                ext_name: "",
                occupation: "",
                employer_name: "",
                business_address: "",
                telephone_no: "",
                hasSpouse: false,
            },
            father: {
                last_name: "",
                first_name: "",
                middle_name: "",
                ext_name: "",
                birth_date: ""
            },
            mother: {
                last_name: "",
                first_name: "",
                middle_name: "",
                maiden_name: "",
                birth_date: ""
            },
            children: []
        },
        educationalBackground: {
            elementary: [
              {
                is_graduated: false,
                level: "Elementary",
                course: "",
                school: "",
                highest_attainment: "",
                from_date: "",
                from_year: "",
                to_date: "",
                to_year: "",
                award: "",
                year_graduated: "",
              }
            ],
            secondary: [
              {
                is_graduated: false,
                level: "Secondary",
                course: "",
                school: "",
                highest_attainment: "",
                from_date: "",
                from_year: "",
                to_date: "",
                to_year: "",
                award: "",
                year_graduated: "",
              }
            ],
            vocational: [],
            college: [
                {
                  is_graduated: false,
                  level: "College",
                  course: "",
                  school: "",
                  highest_attainment: "",
                  from_date: "",
                from_year: "",
                to_date: "",
                to_year: "",
                  award: "",
                  year_graduated: "",
                }
            ],
            graduate: [],

        },
        civilServiceEligibility: [],
        workExperience: [],
        voluntaryWork: [],
        learningAndDevelopment: [],
        otherInformation: {
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
    },
    requirementsState: {
      requirements: []
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
            error: null 
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
              error: error.message || 'Failed to fetch countries.',
              loading: false,
            },
          }))
        }
      },
    },
    permanentAddressState: {
      provinces: [],
      provincesLoading: false,
      provincesError: null,
      citymuns: [],
      citymunsLoading: false,
      citymunsError: null,
      barangays: [],
      barangaysLoading: false,
      barangaysError: null,
      fetchProvinces: async () => {
        set((state) => ({
          permanentAddressState: { 
            ...state.permanentAddressState, 
            provincesLoading: true, 
            provincesError: null 
          },
        }))

        try {
          const response = await getProvinces()

          const provinceData = response.data
          ?.map((province) => ({
            label: province.name,
            value: province.code,
          }))
          .sort((a, b) => a.label.localeCompare(b.label))
    
          set((state) => ({
            permanentAddressState: {
              ...state.permanentAddressState,
              provinces: provinceData,
              provincesLoading: false,
            },
          }))
        } catch (error) {
          set((state) => ({
            permanentAddressState: {
              ...state.permanentAddressState,
              provincesError: error.message || 'Failed to fetch provinces.',
              provincesLoading: false,
            },
          }))
        }
      },
      fetchCitymuns: async (provinceCode) => {
        
        set((state) => ({
          permanentAddressState: { 
            ...state.permanentAddressState, 
            citymunsLoading: true, 
            citymunsError: null 
          },
        }))

        try {
          const response = await getMunicipalities({provinceCode})

          const citymunData = response.data
          ?.map((citymun) => ({
            label: citymun.name,
            value: citymun.code,
          }))
          .sort((a, b) => a.label.localeCompare(b.label))
    
          set((state) => ({
            permanentAddressState: {
              ...state.permanentAddressState,
              citymuns: citymunData,
              citymunsLoading: false,
            },
          }))
        } catch (error) {
          set((state) => ({
            permanentAddressState: {
              ...state.permanentAddressState,
              citymunsError: error.message || 'Failed to fetch city/municipalities.',
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
            barangaysError: null 
          },
        }))

        try {
          const response = await getBarangays({cityOrMunicipalityCode})

          const barangayData = response.data
          ?.map((barangay) => ({
            label: barangay.name,
            value: barangay.code,
          }))
          .sort((a, b) => a.label.localeCompare(b.label))
    
          set((state) => ({
            permanentAddressState: {
              ...state.permanentAddressState,
              barangays: barangayData,
              barangaysLoading: false,
            },
          }))
        } catch (error) {
          set((state) => ({
            permanentAddressState: {
              ...state.permanentAddressState,
              barangaysError: error.message || 'Failed to fetch barangays.',
              barangaysLoading: false,
            },
          }))
        }
      },
    },
    residentialAddressState: {
      provinces: [],
      provincesLoading: false,
      provincesError: null,
      citymuns: [],
      citymunsLoading: false,
      citymunsError: null,
      barangays: [],
      barangaysLoading: false,
      barangaysError: null,
      fetchProvinces: async () => {
        set((state) => ({
          residentialAddressState: { 
            ...state.residentialAddressState, 
            provincesLoading: true, 
            provincesError: null 
          },
        }))

        try {
          const response = await getProvinces()

          const provinceData = response.data
          ?.map((province) => ({
            label: province.name,
            value: province.code,
          }))
          .sort((a, b) => a.label.localeCompare(b.label))
    
          set((state) => ({
            residentialAddressState: {
              ...state.residentialAddressState,
              provinces: provinceData,
              provincesLoading: false,
            },
          }))
        } catch (error) {
          set((state) => ({
            residentialAddressState: {
              ...state.residentialAddressState,
              provincesError: error.message || 'Failed to fetch provinces.',
              provincesLoading: false,
            },
          }))
        }
      },
      fetchCitymuns: async (provinceCode) => {
        
        set((state) => ({
          residentialAddressState: { 
            ...state.residentialAddressState, 
            citymunsLoading: true, 
            citymunsError: null 
          },
        }))

        try {
          const response = await getMunicipalities({provinceCode})

          const citymunData = response.data
          ?.map((citymun) => ({
            label: citymun.name,
            value: citymun.code,
          }))
          .sort((a, b) => a.label.localeCompare(b.label))
    
          set((state) => ({
            residentialAddressState: {
              ...state.residentialAddressState,
              citymuns: citymunData,
              citymunsLoading: false,
            },
          }))
        } catch (error) {
          set((state) => ({
            residentialAddressState: {
              ...state.residentialAddressState,
              citymunsError: error.message || 'Failed to fetch city/municipalities.',
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
            barangaysError: null 
          },
        }))

        try {
          const response = await getBarangays({cityOrMunicipalityCode})

          const barangayData = response.data
          ?.map((barangay) => ({
            label: barangay.name,
            value: barangay.code,
          }))
          .sort((a, b) => a.label.localeCompare(b.label))
    
          set((state) => ({
            residentialAddressState: {
              ...state.residentialAddressState,
              barangays: barangayData,
              barangaysLoading: false,
            },
          }))
        } catch (error) {
          set((state) => ({
            residentialAddressState: {
              ...state.residentialAddressState,
              barangaysError: error.message || 'Failed to fetch barangays.',
              barangaysLoading: false,
            },
          }))
        }
      },
    },
    // Children
    addChild: () => set((state) => {
      const newChild = {
        id: "",
        last_name: "", 
        first_name: "", 
        middle_name: "",
        ext_name: "", 
        birth_date: "" 
      }

      const newFamilyBackground = {
        ...state.pdsState.familyBackground,
        children: [...state.pdsState.familyBackground.children, newChild],
      }
    
      return {
        pdsState: {
          ...state.pdsState,
          familyBackground: newFamilyBackground,
        }
      }
    }),
    updateChild: (index, field, value) => set((state) => ({
        pdsState: {
            ...state.pdsState,
            familyBackground: {
            ...state.pdsState.familyBackground,
            children: state.pdsState.familyBackground.children.map((child, i) => 
                i === index ? { ...child, [field]: value } : child
            ),
            }
        }
    })),
    removeChild: (index) => set((state) => ({
        pdsState: {
            ...state.pdsState,
            familyBackground: {
            ...state.pdsState.familyBackground,
            children: state.pdsState.familyBackground.children.filter((_, i) => i !== index),
            }
        }
    })),
    // Education
     addEducation: (type) => set((state) => {
      const newEntry = {
        is_graduated: false,
        level: type,
        course: "",
        school: "",
        highest_attainment: "",
        from_date: "",
        to_date: "",
        award: "",
        year_graduated: "",
      }
  
      const newEducationalBackground = {
        ...state.pdsState.educationalBackground,
        [type.toLowerCase()]: [...state.pdsState.educationalBackground[type.toLowerCase()], newEntry],
      }
    
      return {
        pdsState: {
          ...state.pdsState,
          educationalBackground: newEducationalBackground,
        }
      }
    }),
    updateEducation: (type, index, field, value) => set((state) => ({
      pdsState: {
        ...state.pdsState,
        educationalBackground: {
          ...state.pdsState.educationalBackground,
          [type.toLowerCase()]: state.pdsState.educationalBackground[type.toLowerCase()].map((entry, i) => 
            i === index ? { ...entry, [field]: value } : entry
          ),
        }
      }
    })),
    removeEducation: (type, index) => set((state) => {
      const updatedEntries = state.pdsState.educationalBackground[type.toLowerCase()].filter((_, i) => i !== index)
      const newEducationalBackground = {
        ...state.pdsState.educationalBackground,
        [type.toLowerCase()]: updatedEntries.length > 0 ? updatedEntries : [],
      }
    
      return {
        pdsState: {
          ...state.pdsState,
          educationalBackground: newEducationalBackground,
        }
      }
    }),
    //Civil Service Eligibility
    addEligibility: () => set((state) => ({
        pdsState: {
          ...state.pdsState,
          civilServiceEligibility: [
            ...state.pdsState.civilServiceEligibility,
            {
              eligibility: "",
              rating: "",
              exam_date: "",
              exam_place: "",
              license_no: "",
              validity_date: "",
            }
          ]
        }
    })),
    updateEligibility: (index, field, value) => set((state) => ({
        pdsState: {
            ...state.pdsState,
            civilServiceEligibility: state.pdsState.civilServiceEligibility.map((child, i) => 
                i === index ? { ...child, [field]: value } : child
            )
        }
    })),
    removeEligibility: (index) => set((state) => {
        const updatedEligibility = state.pdsState.civilServiceEligibility.filter((_, i) => i !== index)
        return {
          pdsState: {
            ...state.pdsState,
            civilServiceEligibility: updatedEligibility.length > 0 ? updatedEligibility : []
          }
        }
    }),
    //Work Experience
    addWorkExperience: () => set((state) => ({
        pdsState: {
          ...state.pdsState,
          workExperience: [
            ...state.pdsState.workExperience,
            {
                agency: "",
                position: "",
                appointment: "",
                grade: 0,
                step: 0,
                monthly_salary: 0,
                from_date: "",
                to_date: "",
                isGovtService: false
            }
          ]
        }
    })),
    updateWorkExperience: (index, field, value) => set((state) => ({
        pdsState: {
            ...state.pdsState,
            workExperience: state.pdsState.workExperience.map((child, i) => 
                i === index ? { ...child, [field]: value } : child
            )
        }
    })),
    removeWorkExperience: (index) => set((state) => {
        const updatedWorkExperience = state.pdsState.workExperience.filter((_, i) => i !== index)
        return {
          pdsState: {
            ...state.pdsState,
            workExperience: updatedWorkExperience.length > 0 ? updatedWorkExperience : []
          }
        }
    }),
    //Voluntary Work
    addVoluntaryWork: () => set((state) => ({
        pdsState: {
          ...state.pdsState,
          voluntaryWork: [
            ...state.pdsState.voluntaryWork,
            {
                org_name: "",
                org_address: "",
                from_date: "",
                to_date: "",
                hours: "",
                nature_of_work: "",
                isPresent: false
            }
          ]
        }
    })),
    updateVoluntaryWork: (index, field, value) => set((state) => ({
        pdsState: {
            ...state.pdsState,
            voluntaryWork: state.pdsState.voluntaryWork.map((child, i) => 
                i === index ? { ...child, [field]: value } : child
            )
        }
    })),
    removeVoluntaryWork: (index) => set((state) => {
        const updatedVoluntaryWork = state.pdsState.voluntaryWork.filter((_, i) => i !== index)
        return {
          pdsState: {
            ...state.pdsState,
            voluntaryWork: updatedVoluntaryWork.length > 0 ? updatedVoluntaryWork : []
          }
        }
    }),
    //Learning and Development
    addLearningAndDevelopment: () => set((state) => ({
        pdsState: {
          ...state.pdsState,
          learningAndDevelopment: [
            ...state.pdsState.learningAndDevelopment,
            {
                training_title: "",
                from_date: "",
                to_date: "",
                hours: "",
                participation: "",
                type: "",
                conducted_by: "",
            }
          ]
        }
    })),
    updateLearningAndDevelopment: (index, field, value) => set((state) => ({
        pdsState: {
            ...state.pdsState,
            learningAndDevelopment: state.pdsState.learningAndDevelopment.map((child, i) => 
                i === index ? { ...child, [field]: value } : child
            )
        }
    })),
    removeLearningAndDevelopment: (index) => set((state) => {
        const updatedLearningAndDevelopment = state.pdsState.learningAndDevelopment.filter((_, i) => i !== index)
        return {
          pdsState: {
            ...state.pdsState,
            learningAndDevelopment: updatedLearningAndDevelopment.length > 0 ? updatedLearningAndDevelopment : []
          }
        }
    }),
    //Special Skills and Hobbies
    addSkill: () => set((state) => ({
      pdsState: {
        ...state.pdsState,
        otherInformation: {
          ...state.pdsState.otherInformation,
          skills: [
            ...state.pdsState.otherInformation.skills,
            {
              type: "hobbies",
              description: "",
            }
          ]
        }
      }
    })),
    updateSkill: (index, field, value) => set((state) => ({
        pdsState: {
            ...state.pdsState,
            otherInformation: {
            ...state.pdsState.otherInformation,
            skills: state.pdsState.otherInformation.skills.map((child, i) => 
                i === index ? { ...child, [field]: value } : child
            )
            }
        }
    })),
    removeSkill: (index) => set((state) => {
        const updatedSkill = state.pdsState.otherInformation.skills.filter((_, i) => i !== index)
        return {
          pdsState: {
            ...state.pdsState,
            otherInformation: {
              ...state.pdsState.otherInformation,
              skills: updatedSkill.length > 0 ? updatedSkill : []
            }
          }
        }
    }),
    //Non-Academic Distinctions/Recognitions
    addRecognition: () => set((state) => ({
      pdsState: {
        ...state.pdsState,
        otherInformation: {
          ...state.pdsState.otherInformation,
          recognitions: [
            ...state.pdsState.otherInformation.recognitions,
            {
              type: "recognition",
              description: "",
            }
          ]
        }
      }
    })),
    updateRecognition: (index, field, value) => set((state) => ({
        pdsState: {
            ...state.pdsState,
            otherInformation: {
            ...state.pdsState.otherInformation,
            recognitions: state.pdsState.otherInformation.recognitions.map((child, i) => 
                i === index ? { ...child, [field]: value } : child
            )
            }
        }
    })),
    removeRecognition: (index) => set((state) => {
        const updatedRecognition = state.pdsState.otherInformation.recognitions.filter((_, i) => i !== index)
        return {
          pdsState: {
            ...state.pdsState,
            otherInformation: {
              ...state.pdsState.otherInformation,
              recognitions: updatedRecognition.length > 0 ? updatedRecognition : []
            }
          }
        }
    }),
    //Membership in Association/Organization
    addMembership: () => set((state) => ({
      pdsState: {
        ...state.pdsState,
        otherInformation: {
          ...state.pdsState.otherInformation,
          memberships: [
            ...state.pdsState.otherInformation.memberships,
            {
              type: "membership",
              description: "",
            }
          ]
        }
      }
    })),
    updateMembership: (index, field, value) => set((state) => ({
        pdsState: {
            ...state.pdsState,
            otherInformation: {
            ...state.pdsState.otherInformation,
            memberships: state.pdsState.otherInformation.memberships.map((child, i) => 
                i === index ? { ...child, [field]: value } : child
            )
            }
        }
    })),
    removeMembership: (index) => set((state) => {
        const updatedMembership = state.pdsState.otherInformation.memberships.filter((_, i) => i !== index)
        return {
          pdsState: {
            ...state.pdsState,
            otherInformation: {
              ...state.pdsState.otherInformation,
              memberships: updatedMembership.length > 0 ? updatedMembership : []
            }
          }
        }
    }),
    //Questions
    updateQuestion: (itemNo, subItemNo, field, value) => {
      setTimeout(() => {
        set((state) => {
          const updatedQuestions = state.pdsState.otherInformation.questions.map((q) => {
            if (q.item_no === itemNo) {
              if (subItemNo) {
                return {
                  ...q,
                  subQuestions: q.subQuestions.map((sq) =>
                    sq.list === subItemNo ? { ...sq, [field]: value } : sq
                  ),
                }
              } else {
                return { ...q, [field]: value }
              }
            }
            return q
          })
          return {
            pdsState: {
              ...state.pdsState,
              otherInformation: {
                ...state.pdsState.otherInformation,
                questions: updatedQuestions,
              },
            },
          }
        })
      }, 0)
    },

    //References
    updateReference: (index, field, value) => set((state) => ({
      pdsState: {
          ...state.pdsState,
          otherInformation: {
          ...state.pdsState.otherInformation,
          references: state.pdsState.otherInformation.references.map((child, i) => 
              i === index ? { ...child, [field]: value } : child
          )
          }
      }
    })),

    setPds: (data) => set(state => ({
      pdsState: {
        ...state.pdsState,
        ...data
      }
    })),

    setPdsLoading: (loading) => set(state => ({
      state: { ...state, loading }
    })),

    fetchPds: async (payload) => {
      const { 
          toast,
          setPds,
          setPdsLoading
      } = get()

      try {
          setPdsLoading(true)

          const response = await getPds(payload)

          if (response.status === 200) {
              setPds(response.data)
          } else {
              toast({
                  title: "Uh oh! Something went wrong.",
                  description: "There was a problem with your request.",
                  variant: "destructive"
              })
          }
      } catch (error) {
          console.log(error)
      } finally {
          setPdsLoading(false)
      }
    },

    fetchPdsSection: async (section, payload) => {
      const { 
          toast,
          setPds,
          setPdsLoading
      } = get()

      try {
          setPdsLoading(true)

          const response = await getPdsSection(section, payload)

          if (response.status === 200) {
              setPds({ [section]: response.data })
          } else {
              toast({
                  title: "Uh oh! Something went wrong.",
                  description: "There was a problem with your request.",
                  variant: "destructive"
              })
          }
      } catch (error) {
          console.log(error)
      } finally {
          setPdsLoading(false)
      }
    },

    fetchProgress: async () => {

      try{
        const response = await axios.get(route('applicant.pds.progress'))

        if (response.status === 200) {
             set({ progress: response.data })
        }
      } catch (error) {
          console.log(error)
      }
    },

    fetchRequirements: async (payload) => {
      const { 
          toast,
          setPds,
          setPdsLoading
      } = get()

      try {
          setPdsLoading(true)

          const response = await getPds(payload)

          if (response.status === 200) {
              set(state => ({
                  requirementsState: {
                      ...state.requirementsState,
                      requirements: response.data
                  }
              }))
          } else {
              toast({
                  title: "Uh oh! Something went wrong.",
                  description: "There was a problem with your request.",
                  variant: "destructive"
              })
          }
      } catch (error) {
          console.log(error)
      } finally {
          setPdsLoading(false)
      }
    },
}))

export default usePdsStore