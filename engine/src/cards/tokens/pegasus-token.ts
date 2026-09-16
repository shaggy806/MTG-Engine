import { defineCard } from "../define.js";

/** 1/1 white Pegasus with flying — Storm Herd's token. */
export default defineCard({
  name: "Pegasus Token",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Pegasus"],
  power: 1,
  toughness: 1,
  keywords: ["flying"],
  text: "Flying",
});
