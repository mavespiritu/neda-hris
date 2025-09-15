import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

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

export function cn(...inputs) {
    return twMerge(clsx(inputs))
  }