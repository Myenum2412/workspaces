import next from "eslint-config-next";

export default [
  ...next,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-empty-object-type": "off",
      "react-hooks/exhaustive-deps": "warn",
    },
  },
];
