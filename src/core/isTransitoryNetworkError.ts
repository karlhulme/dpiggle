/**
 * Returns true if the given error is a network error.
 *
 * If the fetch function rejects, it will raise a TypeError in
 * most cases.  This TypeError does not distinguish between
 * permanent issues (such as invalid url schemes) and temporary
 * issues (such as dns resolution failure).  Where possible, we
 * identify requests that are pointless to retry.  Otherwise
 * we treat all TypeError's as temporary, since executing an
 * invalid request multiple times is not harmful.
 * @param err An error.
 */
export function isTransitoryNetworkError(err: Error) {
  if (err instanceof TypeError) {
    // It's a TypeError, so look for specific errors that we know are permanent.
    if (
      err.message.includes("scheme") && err.message.includes("not supported")
    ) {
      return false;
    } else {
      return true;
    }
  } else {
    // It's not a TypeError, so we assume the error is permanent.
    return false;
  }
}
