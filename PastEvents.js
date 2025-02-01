// get references to the html elements
const dateInput = document.getElementById('dateInput');
const specificDateBtn = document.getElementById('specificDateBtn');
const todayBtn = document.getElementById('todayBtn');
const dateDisplay = document.getElementById('dateDisplay');
const eventsList = document.getElementById('eventsList');

// define animation keyframes and timing for error and shake animations
const animations = {
  slideUp: [
    { transform: 'translateY(10px)', opacity: 0 },
    { transform: 'translateY(0)', opacity: 1 }
  ],
  shake: [
    { transform: 'translateX(0)' },
    { transform: 'translateX(-5px)' },
    { transform: 'translateX(5px)' },
    { transform: 'translateX(0)' }
  ]
};

const animationTiming = {
  duration: 400,
  easing: 'ease'
};

// function to update the current date display
function updateCurrentDate() {
  // create a new date instance
  const currDate = new Date();
  // options for formatting the date string
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  dateDisplay.textContent = currDate.toLocaleDateString('en-US', options);
}

// function to check if the provided date string is valid in dd/mm format
function isValidDate(dateStr) {
  // if date is empty, return false
  if (!dateStr) return false;

  // split the string by '/' and trim spaces, then convert to integer
  const [dayStr, monthStr] = dateStr.split('/');
  const day = parseInt(dayStr.trim(), 10);
  const month = parseInt(monthStr.trim(), 10);

  // if day or month is not a valid number, return false
  if (!day || !month) return false;
  // if month is out of range, return false
  if (month < 1 || month > 12) return false;

  // use current year for determining number of days in month (helps if not 2024)
  const currentYear = new Date().getFullYear();
  const daysInMonth = new Date(currentYear, month, 0).getDate();
  // if day is out of range, return false
  if (day < 1 || day > daysInMonth) return false;

  return true;
}

// function to get a random date in dd/mm format using current year for month lengths
function getRandomDate() {
  // choose a random month between 1 and 12
  const month = Math.floor(Math.random() * 12) + 1;
  // use current year to calculate the correct number of days in month
  const currentYear = new Date().getFullYear();
  const daysInMonth = new Date(currentYear, month, 0).getDate();
  // choose a random day within the month
  const day = Math.floor(Math.random() * daysInMonth) + 1;
  // return the date in dd/mm format (with leading zeros if necessary)
  return `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}`;
}

// function to show an error message to the user
function showError(message) {
  // clear the events list when showing an error
  eventsList.innerHTML = '';
  // check if there is a <p> element in the parent; reset its text content if found
  const titleP = eventsList.parentElement.querySelector('p');
  if (titleP) {
    titleP.textContent = 'Event:';
  }

  // remove any existing error message from the document
  const existingError = document.querySelector('.error-message');
  if (existingError) {
    existingError.remove();
  }

  // create a new div for the error message and style it
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-message';
  errorDiv.style.cssText = `
    background-color: #fee2e2;
    color: #dc2626;
    padding: 1rem 1.5rem;
    margin: 1rem auto;
    border-radius: 0.5rem;
    font-size: 0.9rem;
    font-weight: 500;
    display: flex;
    align-items: center;
    justify-content: center;
    max-width: 90%;
    box-shadow: 0 2px 4px rgba(220, 38, 38, 0.1);
    border-left: 4px solid #dc2626;
  `;

  // add an error icon and the error message to the errorDiv
  errorDiv.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 0.5rem;">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="8" x2="12" y2="12"></line>
      <line x1="12" y1="16" x2="12.01" y2="16"></line>
    </svg>
    ${message}
  `;

  // insert the errorDiv into the document before the events list
  eventsList.parentElement.insertBefore(errorDiv, eventsList);

  // animate the error message using the slideUp animation
  errorDiv.animate(animations.slideUp, {
    ...animationTiming,
    duration: 400
  });

  // if the error message is related to date format or invalid date, shake the input field
  if (message.includes('format') || message.includes('invalid')) {
    dateInput.animate(animations.shake, {
      duration: 500,
      easing: 'ease-in-out'
    });
  }

  // remove the error message after 1 second with a fade-out animation
  setTimeout(() => {
    errorDiv.animate(
      [
        { opacity: 1 },
        { opacity: 0, transform: 'translateY(-10px)' }
      ],
      {
        duration: 300,
        easing: 'ease-out',
        fill: 'forwards'
      }
    ).onfinish = () => errorDiv.remove();
  }, 1000);
}

// async function to fetch historical events from the api
async function fetchHistoricalEvents(day, month) {
  try {
    const response = await fetch(`https://history.muffinlabs.com/date/${month}/${day}`);

    // check if the response is ok
    if (!response.ok) {
      throw new Error('failed to fetch historical events');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('error fetching data:', error);
    throw error;
  }
}

// async function to display a random event from the fetched events
async function displayRandomEvent(events) {
  // clear any previous events
  eventsList.innerHTML = '';

  // check if the api response contains events and that the list is not empty
  if (!events?.data?.Events || !events.data.Events.length) {
    showError('no events found for this date.');
    return;
  }

  // select a random event from the events array
  const randomEvent = events.data.Events[Math.floor(Math.random() * events.data.Events.length)];

  // create a list item for the event and set initial opacity for fade-in effect
  const eventItem = document.createElement('li');
  eventItem.style.opacity = '0';
  eventItem.style.transition = 'opacity 0.3s ease-in';
  eventItem.innerHTML = `
    <div style="font-weight: 600; margin-bottom: 0.5rem;">year ${randomEvent.year}</div>
    <div>${randomEvent.text}</div>
  `;
  eventsList.appendChild(eventItem);

  // trigger fade-in animation after a short delay
  setTimeout(() => eventItem.style.opacity = '1', 50);
}

// async function to handle click on the specific date button
async function handleSpecificDate() {
  let dateStr = dateInput.value;

  // if the input is empty, get a random date and update the input field
  if (!dateStr) {
    dateStr = getRandomDate();
    dateInput.value = dateStr;
  }
  // if the date is not valid, show an error message
  if (!isValidDate(dateStr)) {
    showError('please enter a valid date in dd/mm format.');
    return;
  }

  // split the date string into day and month parts
  const [day, month] = dateStr.split('/');

  try {
    // disable both buttons while fetching data
    specificDateBtn.disabled = true;
    todayBtn.disabled = true;

    const events = await fetchHistoricalEvents(day, month);
    displayRandomEvent(events);
  } catch (error) {
    showError('unable to fetch historical events. please try again.');
  } finally {
    // re-enable the buttons after fetching
    specificDateBtn.disabled = false;
    todayBtn.disabled = false;
  }
}

// async function to handle click on the today button
async function handleToday() {
  const today = new Date();
  const day = today.getDate();
  const month = today.getMonth() + 1;

  // update the input field to show today's date in dd/mm format
  dateInput.value = `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}`;

  try {
    // disable buttons while fetching data
    specificDateBtn.disabled = true;
    todayBtn.disabled = true;

    const events = await fetchHistoricalEvents(day, month);
    displayRandomEvent(events);
  } catch (error) {
    showError('unable to fetch historical events. please try again.');
  } finally {
    // re-enable the buttons after fetching
    specificDateBtn.disabled = false;
    todayBtn.disabled = false;
  }
}

// event listener for input on the date field
dateInput.addEventListener('input', (e) => {
  let value = e.target.value;

  // remove any character that is not a digit or slash
  value = value.replace(/[^\d/]/g, '');

  // if the length is exactly 2 and no slash is present, add a slash
  if (value.length === 2 && !value.includes('/')) {
    value = value + '/';
  }

  // limit the input to 5 characters for dd/mm format
  if (value.length > 5) {
    value = value.slice(0, 5);
  }

  e.target.value = value;
});

// use keydown instead of keypress to catch the enter key more reliably
dateInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    handleSpecificDate();
  }
});

// add event listeners for the buttons
specificDateBtn.addEventListener('click', handleSpecificDate);
todayBtn.addEventListener('click', handleToday);

// initialize the date display immediately
updateCurrentDate();

// update the date display every minute
setInterval(updateCurrentDate, 60000);
