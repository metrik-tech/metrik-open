function stringWithCommas(x: string | number) {
  if (typeof x === "number") {
    return x;
  }

  return parseFloat(x.replace(/,/g, ""));
}

export function getDelta(
  newValue: string | number,
  lastValue: string | number,
  noNegative?: boolean,
  precision = 3,
) {
  const delta = Number(
    (
      (stringWithCommas(newValue) - stringWithCommas(lastValue)) /
      stringWithCommas(newValue)
    ).toFixed(precision),
  );

  if (isNaN(delta) || delta === Infinity || delta === -Infinity) {
    return 0;
  }

  return delta;
}
