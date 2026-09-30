import { defineCard } from "../define.js";

/** 1/1 colorless Shapeshifter with changeling — Springleaf Parade's token.
 * ("3/2 Shapeshifter Token" is a different body; tokens are keyed by name.) */
export default defineCard({
  name: "Shapeshifter Token",
  art: "c2963ce1-f9d8-437a-9489-e0913a8b8d26",
  types: ["creature"],
  subtypes: ["Shapeshifter"],
  power: 1,
  toughness: 1,
  keywords: ["changeling"],
  text: "Changeling (This token is every creature type.)",
});
