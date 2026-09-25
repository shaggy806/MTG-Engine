import { defineCard } from "../define.js";
import { distinctTargets } from "../helpers.js";

// "Two target …" is one instance of the word "target": two different
// permanents (rule 601.2c), of any of the three types (2017-03-14 ruling).
// They're exiled together and return together.
export default defineCard({
  name: "Ghostly Flicker",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["instant"],
  text:
    "Exile two target artifacts, creatures, and/or lands you control, then return those cards to the " +
    "battlefield under your control.",
  targets: distinctTargets(2, {
    kind: "permanent",
    whose: "you",
    filter: { typesAnyOf: ["artifact", "creature", "land"] },
  }),
  effect: { kind: "flicker", target: [0, 1], underYourControl: true },
});
