# DPiggle

A simple mechanism for executing fragile (e.g. network or database reliant)
functions.

Define an asynchronous javascript function. Pass that function to piggle to
execute.

Piggle will automatically retry the function if a transitory error is raised
using an exponential backoff strategy. You can configure which errors are
considered transitory along with the backoff strategy.

There's a good piggle!

## Example

In the example below, functions `setValueOnService` and `setValueAtDatabase` are
async functions that call an external service and database respectively. We know
they could fail due to temporary issues, so we wrap the calls using the
`retryable` function exported from `piggle`.

```typescript
import { retryable } from "https://github.com/karlhulme/dpiggle/src/index.ts";
import { setValueOnService, SomeNetworkError } from "external-service";
import { setValueAtDatabase, SomeDatabaseError } from "external-database";

async function doWork(newValue: string): Promise<void> {
  // You can determine which errors should be treated as transitory
  const isErrorTransient = (err) =>
    err instanceof SomeNetworkError || err instanceof SomeDatabaseError ||
    err.statusCode === 503;

  // Each retry occurs after the given number of milliseconds, so the strategy below
  // would indicate calling the operation once immediately, a second time after 100ms,
  // a third after a further 200ms and a fourth and final time after a further 500ms.
  const retryStrategy = [100, 200, 500];

  // Processing continues until the retry strategy is exhausted or the canContinueProcessing
  // function returns false.  Typically this is used to stop operations because the host is
  // trying to shutdown.
  const canContinueProcessing = () => true;

  // The connected functins setValueOnService and setValueAtDatabase can then be called
  // in sequence with a high chance of success because transitory errors will be bypassed.
  await retryable(() => setValueOnService(newValue), {
    isErrorTransient,
    retryStrategy,
    canContinueProcessing,
  });

  await retryable(() => setValueAtDatabase(newValue), {
    isErrorTransient,
    retryStrategy,
    canContinueProcessing,
  });
}
```

## Commands

Run `deno task check` to format and test.
