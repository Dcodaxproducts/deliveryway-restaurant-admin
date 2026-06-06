export const getLocalTodayInputValue = () => {
  const today = new Date();
  const timezoneOffsetMs = today.getTimezoneOffset() * 60_000;

  return new Date(today.getTime() - timezoneOffsetMs).toISOString().slice(0, 10);
};
