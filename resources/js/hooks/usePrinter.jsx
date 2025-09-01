import { useCallback } from "react"
import ReactDOM from "react-dom/client"

export const usePrinter = () => {
  const print = useCallback(({ 
    content, 
    paperSize = "letter", 
    orientation = "portrait",
    margin = "1in" // ✅ Default margin
  }) => {
    const iframe = document.createElement("iframe")
    Object.assign(iframe.style, {
      position: "fixed",
      right: "0",
      bottom: "0",
      width: "0",
      height: "0",
      border: "0",
      visibility: "hidden",
    })
    document.body.appendChild(iframe)

    const doc = iframe.contentDocument || iframe.contentWindow?.document
    if (!doc) {
      console.error("Failed to access iframe document.")
      return
    }

    doc.open()
    doc.write(`
      <html>
        <head>
          <style>
            @page {
              size: ${paperSize} ${orientation};
              margin: ${margin};
            }
            html, body {
              margin: 0;
              padding: 0;
              width: 100%;
              height: auto;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
              font-family: system-ui, sans-serif;
              overflow: visible;
            }
          </style>
        </head>
        <body>
          <div id="print-root"></div>
        </body>
      </html>
    `)
    doc.close()

    const renderReactContent = () => {
      const mountNode = doc.getElementById("print-root")
      if (!mountNode) return

      document.querySelectorAll('link[rel="stylesheet"], style').forEach((node) => {
        doc.head.appendChild(node.cloneNode(true))
      })

      const root = ReactDOM.createRoot(mountNode)
      root.render(content)

      setTimeout(() => {
        iframe.contentWindow?.focus()
        iframe.contentWindow?.print()
        setTimeout(() => {
          root.unmount()
          document.body.removeChild(iframe)
        }, 1000)
      }, 500)
    }

    iframe.onload = () => {
      setTimeout(renderReactContent, 100)
    }
  }, [])

  return { print }
}
