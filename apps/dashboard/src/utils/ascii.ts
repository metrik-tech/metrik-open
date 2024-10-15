export function normalize(input: string) {
  // eslint-disable-next-line no-control-regex
  return input.replace(/[^\x00-\x7F]/g, "");
}
