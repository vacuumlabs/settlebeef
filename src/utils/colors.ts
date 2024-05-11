const TOP_BOUNDARY = 20;
const BOTTOM_BOUNDARY = -20;

const calculateRelativeAmount = (
  score: number,
  topValue: number,
  bottomValue: number,
) => {
  if (score >= TOP_BOUNDARY) {
    return topValue;
  }
  if (score <= BOTTOM_BOUNDARY) {
    return bottomValue;
  }

  const valueDiff = topValue - bottomValue;
  const scoreDiff = TOP_BOUNDARY - BOTTOM_BOUNDARY;
  const scoreRatio = (score - BOTTOM_BOUNDARY) / scoreDiff;
  return Math.round(scoreRatio * valueDiff + bottomValue);
};

const errorColor = [239, 83, 80] as const;
const successColor = [76, 175, 80] as const;

export const calculateColorFromStreetCredit = (
  streetCredit: bigint | undefined,
) => {
  if (streetCredit === undefined) {
    return;
  }
  const credit = Number(streetCredit);

  return `rgb(${calculateRelativeAmount(credit, successColor[0], errorColor[0])}, ${calculateRelativeAmount(credit, successColor[1], errorColor[1])}, ${calculateRelativeAmount(credit, successColor[2], errorColor[2])})`;
};
