import { assertStrictEquals } from "../../deps.ts";
import { isTransitoryMarkedError } from "./isTransitoryMarkedError.ts";

Deno.test("Detects an error marked as transitory.", () => {
  // deno-lint-ignore no-explicit-any
  const err = new Error("testError") as any;
  err.__isTransitory = true;

  assertStrictEquals(
    isTransitoryMarkedError(err),
    true,
  );
});

Deno.test("Detects an error not marked as transitory.", () => {
  const err = new Error("testError");

  assertStrictEquals(
    isTransitoryMarkedError(err),
    false,
  );
});
