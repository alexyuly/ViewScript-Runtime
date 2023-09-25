import assert from "assert";

export function countPlacesOfPositiveInteger(integer) {
  assert(!isNaN(integer), `countPlacesOfPositiveInteger expects a number`);

  const number = Number(integer);
  assert(
    number === Math.round(number),
    `countPlacesOfPositiveInteger expects an integer`
  );

  assert(number > 0, `countPlacesOfPositiveInteger expects a positive integer`);

  let numberOfPlaces = 0;

  while (number >= 10 ** numberOfPlaces) {
    numberOfPlaces++;
  }

  return numberOfPlaces;
}
