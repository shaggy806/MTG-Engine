import { defineCard } from "../define.js";

/** The First Flight precon's commander. */
export default defineCard({
  name: "Isperia, Supreme Judge",
  manaCost: "{2}{W}{W}{U}{U}",
  colors: ["W", "U"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Sphinx"],
  power: 6,
  toughness: 4,
  keywords: ["flying"],
  text:
    "Flying\n" +
    "Whenever a creature attacks you or a planeswalker you control, you may draw a card.",
  triggered: [
    {
      trigger: { on: "attacks", who: "any", attackingYou: true },
      targets: [],
      effect: { kind: "may", prompt: "Draw a card?", effect: { kind: "draw", amount: 1 } },
      resolve: null,
      text:
        "Whenever a creature attacks you or a planeswalker you control, you may draw a card.",
    },
  ],
});
