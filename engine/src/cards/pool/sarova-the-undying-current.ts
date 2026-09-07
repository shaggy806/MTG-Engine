import { defineCard } from "../define.js";

/**
 * A legendary creature commander for the Carol seat (Dimir). Carries both a
 * `leaves-battlefield` trigger and a `dies` trigger so the 903.9a rework can
 * be seen doing the right thing: when Sarova is destroyed and its owner sends
 * it to the command zone, the leaves-battlefield trigger fires but the dies
 * trigger does not (it never actually reaches a graveyard — rule 700.4).
 */
export default defineCard({
  name: "Sarova, the Undying Current",
  manaCost: "{2}{U}{B}",
  colors: ["U", "B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Zombie", "Wizard"],
  power: 3,
  toughness: 3,
  text:
    "When Sarova, the Undying Current leaves the battlefield, draw a card.\n" +
    "When Sarova, the Undying Current dies, you gain 3 life.",
  triggered: [
    {
      trigger: { on: "leaves-battlefield", who: "self" },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "When Sarova, the Undying Current leaves the battlefield, draw a card.",
    },
    {
      trigger: { on: "dies", who: "self" },
      targets: [],
      effect: { kind: "gain-life", amount: 3 },
      resolve: null,
      text: "When Sarova, the Undying Current dies, you gain 3 life.",
    },
  ],
});
