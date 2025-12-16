import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, isSameDay, isSameMonth, isSameYear } from "date-fns"

export function formatDate(selectedDate) {
  // Convert the input string to a Date object
  const date = new Date(selectedDate)

  // Check if the date is valid
  if (isNaN(date.getTime())) {
      return 'Invalid Date' // Handle invalid date cases
  }

  // Format the date to a more readable string
  const formattedDate = date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
  })

  return formattedDate
}

export function formatTime(time) {
  const date = new Date(time)

  if (isNaN(date.getTime())) {
    return 'Invalid Time'
  }

  return date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })
}

export function formatTime12(time) {
  if (!time) return "-- : -- --"

  let date

  if (typeof time === "string" && /^\d{2}:\d{2}(:\d{2})?$/.test(time)) {
    // Handle "HH:mm" or "HH:mm:ss"
    const [hours, minutes, seconds = "0"] = time.split(":")
    date = new Date()
    date.setHours(Number(hours), Number(minutes), Number(seconds), 0)
  } else {
    // Try to parse as full datetime
    date = new Date(time)
  }

  if (isNaN(date.getTime())) {
    return "-- : -- --"
  }

  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })
}

export function formatDateWithTime(selectedDate) {
  // Convert the input string to a Date object
  const date = new Date(selectedDate)

  // Check if the date is valid
  if (isNaN(date.getTime())) {
    return 'Invalid Date' // Handle invalid date cases
  }

  // Format the date to include date and time
  const formattedDateWithTime = date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true, // Set to false for 24-hour format
  })

  const formattedDate = formattedDateWithTime.replace(' at ', ' ')

  return formattedDate
}

export function formatDateRange(fromDate, toDate) {
  const from = new Date(fromDate)

  // ✅ Handle "Present"
  if (!toDate) {
    return `${format(from, "MMMM d, yyyy")} - Present`
  }

  const to = new Date(toDate)

  if (isSameDay(from, to)) {
    return format(from, "MMMM d, yyyy") // March 20, 2025
  }

  if (isSameMonth(from, to) && isSameYear(from, to)) {
    // March 20–25, 2025
    return `${format(from, "MMMM d")} - ${format(to, "d, yyyy")}`
  }

  if (isSameYear(from, to)) {
    // November 1 – December 2, 2025
    return `${format(from, "MMMM d")} - ${format(to, "MMMM d, yyyy")}`
  }

  // December 31, 2025 – January 1, 2026
  return `${format(from, "MMMM d, yyyy")} - ${format(to, "MMMM d, yyyy")}`
}

export function formatNumberWithCommas(number){
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
}

export const middleInitial = (middle_name) => {

    let mi = ''
  
    if (middle_name.length > 1) {
      const i = middle_name.substring(0,1).toUpperCase()
      mi = `${i}.`
    } else {
      const i = middle_name.toUpperCase()
      mi = `${i}.`
    }
  
    return mi
  
  }

export const formatFullName = (name) => {
  if (!name) return '';

  const capitalizeWords = (str) =>
    str
      .toLowerCase()
      .split(' ')
      .filter(Boolean)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

  const [last, rest] = name.split(',').map(s => s.trim());

  if (!rest) return capitalizeWords(last);

  // Keep middle initial uppercase (P.)
  const formattedRest = rest
    .split(' ')
    .map(word =>
      word.length === 2 && word.endsWith('.')
        ? word.toUpperCase()
        : capitalizeWords(word)
    )
    .join(' ');

  return `${capitalizeWords(last)}, ${formattedRest}`;
}

export const getTimestamp = () => {
  const d = new Date()

  const pad = (n) => String(n).padStart(2, "0")

  return (
    pad(d.getMonth() + 1) +     // MM
    pad(d.getDate()) +          // DD
    d.getFullYear() +           // YYYY
    pad(d.getHours()) +         // HH
    pad(d.getMinutes()) +       // II
    pad(d.getSeconds())         // SS
  )
}

export function cn(...inputs) {
    return twMerge(clsx(inputs))
  }