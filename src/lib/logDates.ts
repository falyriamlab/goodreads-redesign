/**
 * LogSheet date checks (ISO yyyy-mm-dd, compared as strings). The date picker's max only limits the picker:
 * a date typed by hand can still be anything, so save is blocked here too. "Today" is the demo clock's today.
 */
export function checkLogDates({
  startedAt,
  finishedAt,
  finishing,
  today,
}: {
  startedAt: string
  finishedAt: string
  /** Read or DNF: the Finished field is shown and saved */
  finishing: boolean
  today: string
}) {
  const startedFuture = startedAt !== '' && startedAt > today
  const finishedFuture = finishing && finishedAt !== '' && finishedAt > today
  const outOfOrder = finishing && startedAt !== '' && finishedAt !== '' && finishedAt < startedAt
  const message =
    startedFuture || finishedFuture
      ? "Dates can't be in the future."
      : outOfOrder
        ? "Finish date can't be before you started."
        : null
  return {
    message,
    startedInvalid: startedFuture || (!finishedFuture && outOfOrder),
    finishedInvalid: finishedFuture || (!startedFuture && outOfOrder),
  }
}
