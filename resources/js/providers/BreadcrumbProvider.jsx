import { createContext, useContext, useMemo, useState } from "react"

const BreadcrumbContext = createContext({
  breadcrumbItems: [],
  setBreadcrumbItems: () => {},
})

export const useBreadcrumbs = () => useContext(BreadcrumbContext)

export const BreadcrumbProvider = ({ children }) => {
  const [breadcrumbItems, setBreadcrumbItems] = useState([])

  const value = useMemo(
    () => ({
      breadcrumbItems,
      setBreadcrumbItems,
    }),
    [breadcrumbItems]
  )

  return <BreadcrumbContext.Provider value={value}>{children}</BreadcrumbContext.Provider>
}

export default BreadcrumbProvider
