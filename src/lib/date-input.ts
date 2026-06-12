export const getLocalTodayInputValue = () => {
  const today = new Date();
  const timezoneOffsetMs = today.getTimezoneOffset() * 60_000;

  return new Date(today.getTime() - timezoneOffsetMs).toISOString().slice(0, 10);
};

export const getLocalTodayDateTimeInputValue = () =>
  `${getLocalTodayInputValue()}T00:00`;

export const getStartOfToday = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return today;
};
