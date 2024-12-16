import './bootstrap'
import '../css/app.css'

import { createInertiaApp } from '@inertiajs/react'
import { createRoot } from 'react-dom/client'
import DefaultLayout from "@/layouts/DefaultLayout"

createInertiaApp({
  resolve: name => {
    const pages = import.meta.glob('./pages/**/*.jsx', { eager: true })
    let page = pages[`./pages/${name}.jsx`]

    page.default.layout = ((page) => <DefaultLayout children={page} /> )

    return page
  },
  setup({ el, App, props }) {
    createRoot(el).render(<App {...props} />)
  },
  /* progress: {
    delay: 250,
    color: '#29d',
    includeCSS: true,
    showSpinner: true,
  }, */
})
