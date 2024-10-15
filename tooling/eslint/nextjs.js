/** @type {import('eslint').Linter.Config} */
const config = {
  extends: ["plugin:@next/next/recommended"],
  rules: {
    "@next/next/no-html-link-for-pages": "off",
    "@next/next/no-img-element": "off",
    "@typescript-eslint/non-nullable-type-assertion-style": "off",
  },
};

module.exports = config;
