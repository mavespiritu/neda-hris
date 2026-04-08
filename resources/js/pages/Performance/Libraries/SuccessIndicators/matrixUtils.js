const scoreBands = [5, 4, 3, 2, 1]

const normalizeText = (value) => (value === null || value === undefined ? "" : String(value))

export const conditionTypes = [
  { value: "minimum", label: "Minimum" },
  { value: "maximum", label: "Maximum" },
  { value: "range", label: "Range" },
  { value: "text", label: "Text" },
  { value: "count", label: "Count" },
]

export const unitOptions = [
  { value: "rating", label: "Rating" },
  { value: "percent", label: "Percent" },
  { value: "days", label: "Days" },
  { value: "hours", label: "Hours" },
  { value: "count", label: "Count" },
  { value: "text", label: "Text" },
]

export const timingOptions = [
  { value: "before", label: "Before" },
  { value: "after", label: "After" },
  { value: "on", label: "On" },
  { value: "within", label: "Within" },
]

const optionLabel = (options, value) => options.find((item) => item.value === value)?.label ?? value ?? ""

export const createMatrixRow = (score) => ({
  score,
  condition_type: "",
  condition_text: "",
  meaning: "",
  value_from: "",
  value_to: "",
  unit: "",
  timing: "",
})

export const createMatrixSection = (ratingDimension = "Q") => ({
  rating_dimension: ratingDimension,
  enabled: true,
  rows: scoreBands.map((score) => createMatrixRow(score)),
})

export const createMatrixBlock = () => ({
  sections: ["Q", "E", "T"].map((dimension) => createMatrixSection(dimension)),
})

export const buildMatrixRowAnalysis = (row = {}) => {
  const score = row?.score ? `${row.score} - ` : ""
  const conditionType = row?.condition_type || ""
  const fromValue = row?.value_from !== "" && row?.value_from !== null && row?.value_from !== undefined
    ? String(row.value_from)
    : ""
  const toValue = row?.value_to !== "" && row?.value_to !== null && row?.value_to !== undefined
    ? String(row.value_to)
    : ""
  const unit = optionLabel(unitOptions, row?.unit)
  const timing = optionLabel(timingOptions, row?.timing)
  const conditionText = normalizeText(row?.condition_text).trim()

  if (conditionType === "text") {
    return `${score}${conditionText || "Meets the stated text condition"}`
  }

  if (conditionType === "range") {
    const rangeText = fromValue || toValue ? `${fromValue || "any"} to ${toValue || "any"}` : "a defined range"
    return `${score}${rangeText}${unit ? ` ${unit.toLowerCase()}` : ""}${timing ? ` ${timing.toLowerCase()}` : ""}`
  }

  if (conditionType === "minimum") {
    return `${score}${fromValue || "minimum"}${unit ? ` ${unit.toLowerCase()}` : ""}${timing ? ` ${timing.toLowerCase()}` : ""} or higher`
  }

  if (conditionType === "maximum") {
    return `${score}${toValue || "maximum"}${unit ? ` ${unit.toLowerCase()}` : ""}${timing ? ` ${timing.toLowerCase()}` : ""} or lower`
  }

  if (conditionType === "count") {
    return `${score}${fromValue || "count"}${unit ? ` ${unit.toLowerCase()}` : ""}${timing ? ` ${timing.toLowerCase()}` : ""}`
  }

  return `${score}Define the rule to describe this score.`
}

export const normalizeMatrixPayload = (value) => {
  const payload = (() => {
    if (Array.isArray(value)) return value
    if (typeof value === "string" && value.trim()) {
      try {
        const parsed = JSON.parse(value)
        return Array.isArray(parsed) ? parsed : []
      } catch (error) {
        return []
      }
    }

    return []
  })()

  return payload.map((matrix) => {
    const sourceSections = Array.isArray(matrix?.sections) && matrix.sections.length
      ? matrix.sections
      : [
          {
            rating_dimension: "Q",
            section_title: "Quality",
            section_description: "",
            rows: Array.isArray(matrix?.rows) ? matrix.rows : [],
          },
          {
            rating_dimension: "E",
            section_title: "Efficiency",
            section_description: "",
            rows: [],
          },
          {
            rating_dimension: "T",
            section_title: "Timeliness",
            section_description: "",
            rows: [],
          },
        ]

    return {
      sections: ["Q", "E", "T"].map((dimension) => {
        const section = sourceSections.find((item) => {
          const current = String(item?.rating_dimension ?? "").toUpperCase()
          return current === dimension || (dimension === "E" && current === "QT")
        }) || {}
        const rows = Array.isArray(section?.rows) ? section.rows : []

        return {
          rating_dimension: dimension,
          enabled: section?.enabled !== false,
          rows: scoreBands.map((score) => {
            const row = rows.find((item) => Number(item?.score) === score) || {}

            return {
              score,
              condition_type: row?.condition_type || "",
              condition_text: normalizeText(row?.condition_text),
              meaning: normalizeText(row?.meaning),
              value_from: row?.value_from ?? "",
              value_to: row?.value_to ?? "",
              unit: row?.unit || "",
              timing: row?.timing || "",
            }
          }),
        }
      }),
    }
  })
}
