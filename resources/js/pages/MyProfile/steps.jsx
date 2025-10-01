// src/data/pdsSteps.js
import {
  UserPen,
  House,
  GraduationCap,
  FileText,
  BriefcaseBusiness,
  Waypoints,
  Brain,
  SquareLibrary,
  FolderOpen,
  Save,
} from "lucide-react"

import PersonalInformation from "./Pds/PersonalInformation"
import FamilyBackground from "./Pds/FamilyBackground"
import EducationalBackground from "./Pds/EducationalBackground"
import CivilServiceEligibility from "./Pds/CivilServiceEligibility"
import WorkExperience from "./Pds/WorkExperience"
import VoluntaryWork from "./Pds/VoluntaryWork"
import LearningAndDevelopment from "./Pds/LearningAndDevelopment"
import OtherInformation from "./Pds/OtherInformation"
import Review from "./Pds/Review"

export const steps = [
  { id: "personalInformation", label: "Personal Information", component: PersonalInformation, icon: <UserPen className="w-5 h-5" /> },
  { id: "familyBackground", label: "Family Background", component: FamilyBackground, icon: <House className="w-5 h-5" /> },
  { id: "educationalBackground", label: "Educational Background", component: EducationalBackground, icon: <GraduationCap className="w-5 h-5" /> },
  { id: "civilServiceEligibility", label: "Civil Service Eligibility", component: CivilServiceEligibility, icon: <FileText className="w-5 h-5" /> },
  { id: "workExperience", label: "Work Experience", component: WorkExperience, icon: <BriefcaseBusiness className="w-5 h-5" /> },
  { id: "voluntaryWork", label: "Voluntary Work", component: VoluntaryWork, icon: <Waypoints className="w-5 h-5" /> },
  { id: "learningAndDevelopment", label: "Learning & Development", component: LearningAndDevelopment, icon: <Brain className="w-5 h-5" /> },
  { id: "otherInformation", label: "Other Information", component: OtherInformation, icon: <SquareLibrary className="w-5 h-5" /> },
  { id: "review", label: "Review Profile", component: Review, icon: <Save className="w-5 h-5" /> },
]
