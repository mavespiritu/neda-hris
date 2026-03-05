import "./bootstrap"
import "../css/app.css"

import { createInertiaApp } from "@inertiajs/react"
import { createRoot } from "react-dom/client"
import DefaultLayout from "@/layouts/DefaultLayout"
import "ag-grid-community/styles/ag-grid.css"
import "ag-grid-community/styles/ag-theme-quartz.css"
import { ModuleRegistry, AllCommunityModule } from "ag-grid-community"

ModuleRegistry.registerModules([AllCommunityModule])

createInertiaApp({
  resolve: (name) => {
    const pages = import.meta.glob("./pages/**/*.jsx", { eager: true })
    let page = pages[`./pages/${name}.jsx`]

    page.default.layout = (page) => <DefaultLayout children={page} />

    return page
  },
  setup({ el, App, props }) {
    createRoot(el).render(<App {...props} />)
  },
})
