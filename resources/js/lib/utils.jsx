export function formatDate(selectedDate) {
  // Convert the input string to a Date object
  const date = new Date(selectedDate);

  // Check if the date is valid
  if (isNaN(date.getTime())) {
      return 'Invalid Date'; // Handle invalid date cases
  }

  // Format the date to a more readable string
  const formattedDate = date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
  });

  return formattedDate;
}

export function formatNumberWithCommas(number){
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
}