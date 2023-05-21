import { isTransitoryMarkedError } from "./isTransitoryMarkedError.ts";
import { isTransitoryNetworkError } from "./isTransitoryNetworkError.ts";
import {
  OperationInterruptedError,
  OperationTransitoryError,
} from "../errors/index.ts";
import { delay } from "../../deps.ts";

/**
 * By default we retry the func 8 times (in addition to the original call)
 * with an exponential backoff that increases from 100ms to 15s, over the course
 * of just over half a minute.
 */
const defaultRetryIntervalsInMilliseconds = [
  100,
  250,
  500,
  1000,
  2000,
  4000,
  8000,
  15000,
];

/**
 * Represents the options that can be passed to the retryable function.
 */
export interface RetryableOptions {
  /**
   * A function that returns true if the given error is transient (temporary)
   * and can be retried according to the retry strategy.  For errors that are
   * permanent (or unrecognised) this function should return false.
   * If this function is not supplied, then only errors derived from
   * OperationTransitoryError will be treated as transient.
   */
  isErrorTransient?: (err: Error) => boolean;

  /**
   * An array of numbers where each element represents the delay
   * in milliseconds before the promise function is retried after a transient failure.
   */
  retryIntervalsInMilliseconds?: number[];

  /**
   * A function that returns true if an operation can continue processing.
   * If the function returns false then the operation will stop.
   * If this function is not supplied then operations will keep going until
   * the retry strategy is exhausted.
   */
  canContinueProcessing?: () => boolean;
}

/**
 * Returns the result of resolving the given function.  The function will be called at least
 * once, plus an additional attempt each time a transitory error is returned upto the number
 * of elements in the retryIntervalsInMilliseconds array.
 * @param operation A long-running function that returns a promise.
 * @param options The options that control the retries.
 */
export async function retryable<T>(
  operation: () => Promise<T>,
  options?: RetryableOptions,
): Promise<T> {
  let lastError = null;
  const retryIntervalsInMilliseconds = options?.retryIntervalsInMilliseconds ||
    defaultRetryIntervalsInMilliseconds;

  for (let i = 0; i <= retryIntervalsInMilliseconds.length; i++) {
    if (i > 0) {
      await delay(retryIntervalsInMilliseconds[i - 1]);
    }

    if (options?.canContinueProcessing && !options.canContinueProcessing()) {
      throw new OperationInterruptedError();
    }

    try {
      // We must await here and then return the data in a separate line,
      // otherwise any exception will be thrown in the context of the caller and not here.
      const data = await operation();
      return data;
    } catch (err) {
      const isTransientError = (err instanceof OperationTransitoryError) ||
        isTransitoryNetworkError(err) ||
        isTransitoryMarkedError(err) ||
        (options?.isErrorTransient && options.isErrorTransient(err));

      if (isTransientError) {
        lastError = err;
      } else {
        throw err;
      }
    }
  }

  throw lastError;
}
