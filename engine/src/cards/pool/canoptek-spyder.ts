import { defineCard } from "../define.js";

// EDHREC rank 3293.

const DRAW_TEXT =
  "Fabricator Claw Array — Whenever another nontoken artifact creature or Vehicle you control enters, draw a card.";

export default defineCard({
  name: "Canoptek Spyder",
  manaCost: "{5}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Spider"],
  power: 4,
  toughness: 4,
  keywords: ["flying"],
  text: `Flying\n${DRAW_TEXT}`,
  triggered: [
    {
      trigger: {
        on: "enters-battlefield",
        who: "you-control",
        otherOnly: true,
        filter: { token: false, anyOf: [{ types: ["artifact", "creature"] }, { subtype: "Vehicle" }] },
      },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: DRAW_TEXT,
    },
  ],
});
