export const calculateSLATimeLeft = (createdAt, priority, status, totalPausedDuration = 0) => {
  if (status === 'Resolved' || status === 'Closed') {
    return 'Resolved';
  }

  const priorityHours = {
    'Low': 72,
    'Medium': 48,
    'High': 24,
    'Critical': 8
  };

  const allowedHours = priorityHours[priority] || 48;
  const allowedMs = allowedHours * 60 * 60 * 1000;
  
  const createdDate = new Date(createdAt);
  const now = new Date();
  
  let elapsedMs = now - createdDate;
  
  // Subtract paused duration (in minutes -> ms)
  elapsedMs -= (totalPausedDuration * 60 * 1000);
  
  const remainingMs = allowedMs - elapsedMs;

  if (remainingMs <= 0) {
    return 'Breached';
  }

  const remainingHours = Math.floor(remainingMs / (1000 * 60 * 60));
  const remainingMinutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (remainingHours > 0) {
    return `${remainingHours}h ${remainingMinutes}m`;
  }
  return `${remainingMinutes}m`;
};
