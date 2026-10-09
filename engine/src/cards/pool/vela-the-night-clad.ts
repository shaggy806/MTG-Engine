import { defineCard } from "../define.js";
import { thisOrAnother } from "../helpers.js";

export default defineCard({
  name: "Vela the Night-Clad",
  manaCost: "{4}{U}{B}",
  colors: ["B", "U"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Wizard"],
  power: 4,
  toughness: 4,
  keywords: ["intimidate"],
  text:
    "Intimidate\n" +
    "Other creatures you control have intimidate.\n" +
    "Whenever Vela or another creature you control leaves the battlefield, each opponent loses 1 life.",
  static: [
    {
      affects: { scope: "creatures-you-control", excludeSelf: true },
      grantKeywords: ["intimidate"],
      text: "Other creatures you control have intimidate.",
    },
  ],
  // "Vela **or another creature** you control": Vela whatever she is then,
  // and any other creature, as it last existed — not a land or an artifact.
  triggered: thisOrAnother({
    trigger: { on: "leaves-battlefield", who: "you-control", filter: { type: "creature" } },
    targets: [],
    effect: { kind: "lose-life", amount: 1, who: "each-opponent" },
    resolve: null,
    text: "Whenever Vela or another creature you control leaves the battlefield, each opponent loses 1 life.",
  }),
});
