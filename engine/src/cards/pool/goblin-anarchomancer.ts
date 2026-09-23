import { defineCard } from "../define.js";

// "Red or green": `anyOf` over the two colours, so a spell that's both is
// still only {1} cheaper (the 2021-06-18 ruling) — the static applies once.
// `controlledBy: "you"` is evaluated from the Anarchomancer's controller's
// side, which is what scopes it to spells *you* cast (Magnus the Red's
// shape). A reduction only touches the generic part of a cost.
const TEXT = "Each spell you cast that's red or green costs {1} less to cast.";

export default defineCard({
  name: "Goblin Anarchomancer",
  manaCost: "{R}{G}",
  colors: ["R", "G"],
  types: ["creature"],
  subtypes: ["Goblin", "Shaman"],
  power: 2,
  toughness: 2,
  text: TEXT,
  static: [
    {
      affects: { scope: "self" },
      costModification: {
        applies: { anyOf: [{ colors: ["R"] }, { colors: ["G"] }], controlledBy: "you" },
        reduceGeneric: 1,
      },
      text: TEXT,
    },
  ],
});
