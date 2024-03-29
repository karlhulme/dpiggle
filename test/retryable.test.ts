import {
  assertRejects,
  assertSpyCalls,
  assertStrictEquals,
  spy,
} from "../deps.ts";
import {
  OperationInterruptedError,
  OperationTransitoryError,
  retryable,
} from "../mod.ts";

class CustomTransitoryError extends OperationTransitoryError {}
class BespokeError extends Error {}

function createTestOperation(results: unknown[]) {
  let index = 0;

  return function () {
    const result = results[index++];

    return new Promise((resolve, reject) => {
      if (result instanceof Error) {
        reject(result);
      } else {
        resolve(result);
      }
    });
  };
}

Deno.test("An operation that passes is executed once.", async () => {
  const testOp = spy(createTestOperation([123]));

  const result = await retryable(testOp);
  assertStrictEquals(result, 123);
  assertSpyCalls(testOp, 1);
});

Deno.test("An operation that fails with a permanent error is executed once and raises the underlying error.", async () => {
  const testOp = spy(createTestOperation([new Error("FAIL")]));
  await assertRejects(() => retryable(testOp), Error, "FAIL");
  assertSpyCalls(testOp, 1);
});

Deno.test("An operation that fails with a permanent network error is executed once and raises the underlying error.", async () => {
  const testOp = spy(
    createTestOperation([new TypeError("scheme 'madeup' not supported")]),
  );

  await assertRejects(
    () => retryable(testOp),
    TypeError,
    "scheme 'madeup' not supported",
  );

  assertSpyCalls(testOp, 1);
});

Deno.test("An operation that fails with transitory (unrecognised) network errors is re-tried and can succeed.", async () => {
  const testOp = spy(createTestOperation([
    new TypeError("UNKNOWN"),
    123,
  ]));

  const result = await retryable(testOp);
  assertStrictEquals(result, 123);
  assertSpyCalls(testOp, 2);
});

Deno.test("An operation that fails with transitory marked errors is re-tried and can succeed.", async () => {
  // deno-lint-ignore no-explicit-any
  const markedErr = new Error() as any;
  markedErr.__isTransitory = true;

  const testOp = spy(createTestOperation([
    markedErr,
    123,
  ]));

  const result = await retryable(testOp);
  assertStrictEquals(result, 123);
  assertSpyCalls(testOp, 2);
});

Deno.test("An operation that fails with transitory errors derived from OperationTransitoryError is re-tried and can succeed.", async () => {
  const testOp = spy(createTestOperation([
    new OperationTransitoryError("STANDARD"),
    new CustomTransitoryError("CUSTOM"),
    123,
  ]));

  const result = await retryable(testOp);
  assertStrictEquals(result, 123);
  assertSpyCalls(testOp, 3);
});

Deno.test("An operation that fails with transitory bespoke errors is re-tried and can succeed.", async () => {
  const testOp = spy(createTestOperation([
    new BespokeError("BESPOKE"),
    123,
  ]));

  const result = await retryable(testOp, {
    isErrorTransient: (err) => err instanceof BespokeError,
  });

  assertStrictEquals(result, 123);
  assertSpyCalls(testOp, 2);
});

Deno.test("An operation that fails with transitory errors too many times raises the last transitory error.", async () => {
  const testOp = spy(createTestOperation([
    new TypeError("temporary"),
    new OperationTransitoryError("STANDARD"),
    new OperationTransitoryError("LAST"),
  ]));

  await assertRejects(
    () => retryable(testOp, { retryIntervalsInMilliseconds: [100, 200] }),
    OperationTransitoryError,
    "LAST",
  );

  assertSpyCalls(testOp, 3);
});

Deno.test("An operation can be interrupted and this is checked before the first invocation.", async () => {
  const testOp = spy(createTestOperation([
    123,
  ]));

  await assertRejects(
    () => retryable(testOp, { canContinueProcessing: () => false }),
    OperationInterruptedError,
  );

  assertSpyCalls(testOp, 0);
});
