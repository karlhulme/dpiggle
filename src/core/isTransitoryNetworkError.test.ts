import { assertStrictEquals } from "../../deps.ts";
import { isTransitoryNetworkError } from "./isTransitoryNetworkError.ts";

Deno.test("Detects a schema-not-supported error marked as permanent.", () => {
  // deno-lint-ignore no-explicit-any
  const err = new Error("testError - scheme abc is not supported") as any;

  assertStrictEquals(
    isTransitoryNetworkError(err),
    false,
  );
});

Deno.test("Treats unknown network errors as transitory.", () => {
  const err = new TypeError("unknownError");

  assertStrictEquals(
    isTransitoryNetworkError(err),
    true,
  );
});
