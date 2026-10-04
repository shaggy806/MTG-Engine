import { defineCard } from "../define.js";

// EDHREC rank 2785.
// Lithoform Engine's spell copy and Sublime Epiphany's token copy, each
// behind "{T}, Sacrifice this land". The rulings (a copy keeps X and modes,
// may get new targets, isn't cast; the token copies the copiable values, a
// copy of a copy included) are those effects' own.
const COPY_TEXT =
  "{2}{C}, {T}, Sacrifice this land: Copy target instant or sorcery spell you control. You may choose new targets for the copy.";
const TOKEN_TEXT = "{4}{C}, {T}, Sacrifice this land: Create a token that's a copy of target creature you control.";

export default defineCard({
  name: "Mirrorpool",
  colors: [],
  types: ["land"],
  text: `This land enters tapped.\n{T}: Add {C}.\n${COPY_TEXT}\n${TOKEN_TEXT}`,
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "C", amount: 1 },
      resolve: null,
      text: "{T}: Add {C}.",
    },
    {
      cost: { mana: "{2}{C}", tap: true, sacrifice: "self" },
      targets: [{ kind: "spell", whose: "you", filter: { typesAnyOf: ["instant", "sorcery"] } }],
      effect: { kind: "copy-spell", target: 0, newTargets: true },
      resolve: null,
      text: COPY_TEXT,
    },
    {
      cost: { mana: "{4}{C}", tap: true, sacrifice: "self" },
      targets: ["creature-you-control"],
      effect: { kind: "create-token-copy", of: 0, count: 1 },
      resolve: null,
      text: TOKEN_TEXT,
    },
  ],
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "enters-battlefield", tapped: true },
      text: "This land enters tapped.",
    },
  ],
});
