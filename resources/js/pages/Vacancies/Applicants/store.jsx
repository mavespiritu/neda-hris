import { create } from 'zustand'
import { format } from 'date-fns'
import { router } from '@inertiajs/react'
import { getPds } from './api'

export const store = create((set, get) => ({
 
    applicants: {
        data: [],
        isLoading: false,
        error: null,
        filters: {},
    },

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

    requirements: {
        data: [],
        isLoading: false,
        error: null,
        filters: {},
    },

    setApplicants: (updater) =>
        set((state) =>
            typeof updater === "function"
                ? { applicants: updater(state.applicants) }
                : { applicants: updater }
        ),

    fetchApplicants: async(id, {filters = {}} = {}) => {
        set((state) => ({
        applicants: {
            ...state.applicants,
            isLoading: true,
            error: null,
            filters
        }
        }))

        try {
            const response = await axios.get(route('vacancies.applicants.index', id),{filters})

            const data = response.data

            set((state) => ({
                applicants: {
                    ...state.applicants,
                    data,
                    isLoading: false,
                    error: null,
                }
            }))
        } catch (error) {

            set((state) => ({
                applicants: {
                    ...state.applicants,
                    error: error.message || 'Failed to fetch applicants.',
                    isLoading: false,
                }
            }))
            
        }
    },

    fetchPds: async (id) => {
          const { 
              toast,
              setPds,
              setPdsLoading
          } = get()
    
          try {
              setPdsLoading(true)
    
              const response = await getPds(id)
    
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

    setPds: (data) => set(state => ({
      pdsState: {
        ...state.pdsState,
        ...data
      }
    })),

    setPdsLoading: (loading) => set(state => ({
      state: { ...state, loading }
    })),

    fetchRequirements: async(id, {filters = {}} = {}) => {
        set((state) => ({
        requirements: {
            ...state.requirements,
            isLoading: true,
            error: null,
            filters
        }
        }))

        try {
            const response = await axios.get(route('vacancies.applicants.requirements', id), {
            params: filters, 
            })

            const data = response.data

            set((state) => ({
                requirements: {
                    ...state.requirements,
                    data,
                    isLoading: false,
                    error: null,
                }
            }))
        } catch (error) {

            set((state) => ({
                requirements: {
                    ...state.requirements,
                    error: error.message || 'Failed to fetch requirements.',
                    isLoading: false,
                }
            }))
            
        }
    },
}))