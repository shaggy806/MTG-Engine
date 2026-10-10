import { defineCard } from "../define.js";
import { crew } from "../helpers.js";

// EDHREC rank 3026. The copy is of the token as it is when the trigger
// resolves (rule 707.2 — copiable values only).
const CATS = "When Esika's Chariot enters, create two 2/2 green Cat creature tokens.";
const COPY = "Whenever Esika's Chariot attacks, create a token that's a copy of target token you control.";

export default defineCard({
  name: "Esika's Chariot",
  manaCost: "{3}{G}",
  colors: ["G"],
  supertypes: ["legendary"],
  types: ["artifact"],
  subtypes: ["Vehicle"],
  power: 4,
  toughness: 4,
  text: `${CATS}\n${COPY}\nCrew 4`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "2/2 Green Cat Token", count: 2 },
      resolve: null,
      text: CATS,
    },
    {
      trigger: { on: "attacks", who: "self" },
      targets: [{ kind: "permanent", whose: "you", filter: { token: true } }],
      effect: { kind: "create-token-copy", of: 0, count: 1, who: "you" },
      resolve: null,
      text: COPY,
    },
  ],
  activated: [crew(4)],
});
