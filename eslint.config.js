// @ts-check

import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

/**
 * @see https://typescript-eslint.io/getting-started
 */
export default tseslint.config(
  eslint.configs.recommended,
  tseslint.configs.recommended,
);
