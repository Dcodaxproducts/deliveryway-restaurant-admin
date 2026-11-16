export type ScheduleBreak = { startTime: string; endTime: string };

const minutesSinceMidnight = (value: string) => {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
};

const endMinutesAfter = (value: string, startMinutes: number) => {
  let minutes = minutesSinceMidnight(value);
  while (minutes <= startMinutes) minutes += 24 * 60;
  return minutes;
};

export const isOvernightSchedule = (openTime?: string, closeTime?: string) =>
  Boolean(openTime && closeTime && closeTime <= openTime);

const toBreakTimeline = (scheduleBreak: ScheduleBreak, openMinutes: number) => {
  let startMinutes = minutesSinceMidnight(scheduleBreak.startTime);
  while (startMinutes < openMinutes) startMinutes += 24 * 60;
  return {
    startMinutes,
    endMinutes: endMinutesAfter(scheduleBreak.endTime, startMinutes),
  };
};

export const isBreakWithinOpeningWindow = (
  scheduleBreak: ScheduleBreak,
  openTime: string,
  closeTime: string,
) => {
  if (scheduleBreak.startTime === scheduleBreak.endTime) return false;
  const openMinutes = minutesSinceMidnight(openTime);
  const closeMinutes = endMinutesAfter(closeTime, openMinutes);
  const { startMinutes, endMinutes } = toBreakTimeline(scheduleBreak, openMinutes);
  return startMinutes >= openMinutes && endMinutes <= closeMinutes;
};

export const haveOverlappingBreaks = (
  breaks: ScheduleBreak[],
  openTime: string,
) => {
  const openMinutes = minutesSinceMidnight(openTime);
  const sorted = breaks
    .map((scheduleBreak) => toBreakTimeline(scheduleBreak, openMinutes))
    .sort((left, right) => left.startMinutes - right.startMinutes);
  return sorted.some(
    (scheduleBreak, index) =>
      index > 0 && scheduleBreak.startMinutes < sorted[index - 1].endMinutes,
  );
};
