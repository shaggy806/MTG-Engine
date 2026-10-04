import { defineCard } from "../define.js";

// Metallurgic Summonings's X/X colorless Construct artifact creature token: it
// prints 0/0 and gets its size from `create-token`'s `basePt` as it's made.

export default defineCard({
  name: "Construct Token (Metallurgic Summonings)",
  art: "c083dc19-2b62-4233-9ab9-04adc758b6d9",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Construct"],
  power: 0,
  toughness: 0,
});
