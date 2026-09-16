import { defineCard } from "../define.js";

export default defineCard({
  name: "Demanding Dragon",
  manaCost: "{3}{R}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Dragon"],
  power: 5,
  toughness: 5,
  keywords: ["flying"],
  text:
    "Flying\n" +
    "When this creature enters, it deals 5 damage to target opponent unless that player sacrifices a creature of their choice.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["opponent"],
      effect: {
        kind: "unless",
        // "that player" — the targeted opponent decides, not us.
        chooser: 0,
        options: [
          { sacrifice: { type: "creature" }, text: "Sacrifice a creature" },
        ],
        otherwise: { kind: "damage", amount: 5, target: 0 },
      },
      resolve: null,
      text: "When this creature enters, it deals 5 damage to target opponent unless that player sacrifices a creature of their choice.",
    },
  ],
});
