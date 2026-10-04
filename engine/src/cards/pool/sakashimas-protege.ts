import { defineCard } from "../define.js";

// EDHREC rank 6022.
// A permanent cast through its cascade is on the battlefield in time to be
// copied (the ruling): the cascade trigger resolves before Sakashima's
// Protege does.

const COPY_TEXT = "You may have this creature enter as a copy of any permanent that entered this turn.";

export default defineCard({
  name: "Sakashima's Protege",
  manaCost: "{4}{U}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Shapeshifter"],
  power: 3,
  toughness: 1,
  keywords: ["flash"],
  text: `Flash\nCascade (When you cast this spell, exile cards from the top of your library until you exile a nonland card that costs less. You may cast it without paying its mana cost. Put the exiled cards on the bottom in a random order.)\n${COPY_TEXT}`,
  copyOnEnter: { filter: { enteredThisTurn: true } },
  triggered: [
    {
      trigger: { on: "this-cast" },
      targets: [],
      effect: { kind: "cascade" },
      resolve: null,
      text: "Cascade",
    },
  ],
});
