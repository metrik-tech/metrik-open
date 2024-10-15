/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-explicit-any */

const stringSimilarity = (
  str1: string,
  str2: string,
  substringLength = 2,
  caseSensitive = false,
) => {
  if (!caseSensitive) {
    str1 = str1.toLowerCase();
    str2 = str2.toLowerCase();
  }

  if (str1.length < substringLength || str2.length < substringLength) return 0;

  const map = new Map<string, number>();
  for (let i = 0; i < str1.length - (substringLength - 1); i++) {
    const substr1 = str1.substring(i, substringLength);
    map.set(substr1, map.has(substr1) ? map.get(substr1)! + 1 : 1);
  }

  let match = 0;
  for (let j = 0; j < str2.length - (substringLength - 1); j++) {
    const substr2 = str2.substring(j, substringLength);
    const count = map.has(substr2) ? map.get(substr2) : 0;
    if (count! > 0) {
      map.set(substr2, count! - 1);
      match++;
    }
  }

  return (match * 2) / (str1.length + str2.length - (substringLength - 1) * 2);
};

type ComparisonResult = {
  matchingTypes: boolean;
  similarity: number;
  deepEqual: boolean;
  propertyCount?: number;
  matching?: number;
  differingProperties?: string[];
  commonProperties?: Record<string, boolean>;
  deepDifferences?: Record<string, ComparisonResult>;
  leftOnly?: string[];
  rightOnly?: string[];
};

const constants = {
  TYPE_MISMATCH: {
    matchingTypes: false,
    similarity: 0,
    deepEqual: false,
  } as ComparisonResult,
};

function compareLiterals(lhs: any, rhs: any): ComparisonResult {
  if (lhs === rhs) {
    return {
      matchingTypes: true,
      similarity: 1,
      deepEqual: true,
    };
  }
  return {
    matchingTypes: true,
    similarity: 0,
    deepEqual: false,
  };
}

function compareArrays(lhs: any[], rhs: any[]): ComparisonResult {
  const length = Math.max(lhs.length, rhs.length);
  const matching = lhs.reduce((acc, item, i) => {
    if (i in rhs) {
      const memberComparison = objectSimilarity(item, rhs[i]);
      if (memberComparison.matchingTypes && memberComparison.deepEqual) {
        return acc + 1;
      }
    }
    return acc;
  }, 0);

  const similarity = length === 0 ? 1 : matching / length;
  const deepEqual = length === matching;

  return {
    matchingTypes: true,
    propertyCount: length,
    matching: matching,
    similarity: similarity,
    deepEqual: deepEqual,
  };
}

function compareObjects(
  lhs: Record<string, any>,
  rhs: Record<string, any>,
): ComparisonResult {
  const matchingProps: Record<string, boolean> = {};
  const leftOnlyProps: string[] = [];
  const rightOnlyProps: string[] = [];
  const differingProps: string[] = [];
  const deepDifferences: Record<string, ComparisonResult> = {};

  let totalProperties = 0;
  let matching = 0;

  for (const prop in lhs) {
    totalProperties++;
    if (prop in rhs) {
      matchingProps[prop] = true;
      const comparison = objectSimilarity(lhs[prop], rhs[prop]);
      if (comparison.matchingTypes && comparison.deepEqual) {
        matching++;
      } else {
        differingProps.push(prop);
        deepDifferences[prop] = comparison;
      }
    } else {
      leftOnlyProps.push(prop);
      differingProps.push(prop);
    }
  }

  for (const prop in rhs) {
    if (!(prop in matchingProps)) {
      totalProperties++;
      rightOnlyProps.push(prop);
      differingProps.push(prop);
    }
  }

  const similarity = totalProperties === 0 ? 1 : matching / totalProperties;
  const deepEqual = totalProperties === matching;

  return {
    matchingTypes: true,
    propertyCount: totalProperties,
    matching: matching,
    similarity: similarity,
    deepEqual: deepEqual,
    differingProperties: differingProps,
    commonProperties: matchingProps,
    deepDifferences: deepDifferences,
    leftOnly: leftOnlyProps,
    rightOnly: rightOnlyProps,
  };
}

function objectSimilarity(lhs: any, rhs: any): ComparisonResult {
  const leftHandType = typeof lhs;
  const rightHandType = typeof rhs;
  const notObjects = leftHandType !== "object" && rightHandType !== "object";

  if (leftHandType === rightHandType && notObjects) {
    return compareLiterals(lhs, rhs);
  }

  if (leftHandType === rightHandType) {
    const leftHandArray = Array.isArray(lhs);
    const rightHandArray = Array.isArray(rhs);
    const leftHandNull = lhs === null;
    const rightHandNull = rhs === null;

    if (leftHandNull && rightHandNull) {
      return compareLiterals(lhs, rhs);
    }

    if (leftHandArray === rightHandArray && !(leftHandNull || rightHandNull)) {
      return leftHandArray ? compareArrays(lhs, rhs) : compareObjects(lhs, rhs);
    }
  }

  return constants.TYPE_MISMATCH;
}

export { objectSimilarity, stringSimilarity };
