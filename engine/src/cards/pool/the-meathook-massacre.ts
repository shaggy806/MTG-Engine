import { defineCard } from "../define.js";

// The enters trigger sees the X the permanent was cast with (rule 107.3m);
// -X is that X times -1.
export default defineCard({
  name: "The Meathook Massacre",
  manaCost: "{X}{B}{B}",
  colors: ["B"],
  supertypes: ["legendary"],
  types: ["enchantment"],
  text:
    "When The Meathook Massacre enters, each creature gets -X/-X until end of turn.\n" +
    "Whenever a creature you control dies, each opponent loses 1 life.\n" +
    "Whenever a creature an opponent controls dies, you gain 1 life.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "modify-pt-all",
        filter: { type: "creature" },
        power: { product: ["x", -1] },
        toughness: { product: ["x", -1] },
        duration: "end-of-turn",
      },
      resolve: null,
      text: "When The Meathook Massacre enters, each creature gets -X/-X until end of turn.",
    },
    {
      trigger: { on: "dies", who: "any", filter: { type: "creature", controlledBy: "you" } },
      targets: [],
      effect: { kind: "lose-life", amount: 1, who: "each-opponent" },
      resolve: null,
      text: "Whenever a creature you control dies, each opponent loses 1 life.",
    },
    {
      trigger: { on: "dies", who: "any", filter: { type: "creature", controlledBy: "opponent" } },
      targets: [],
      effect: { kind: "gain-life", amount: 1 },
      resolve: null,
      text: "Whenever a creature an opponent controls dies, you gain 1 life.",
    },
  ],
});
