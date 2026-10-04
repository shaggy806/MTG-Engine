import { defineCard } from "../define.js";

// EDHREC rank 3622.
//
// Rulings:
//   [2007-10-01] The value of X needs to be determined both when the ability triggers (so you can
//     choose a target) and again when the ability resolves (to check if that target is still
//     legal). If the number of Faeries you control has decreased enough in that time to make the
//     target illegal, Spellstutter Sprite's ability won't resolve (and the targeted spell will
//     resolve as normal).
//
// X lives in the target filter, so it is read when the target is chosen and
// again as the legality of the target is rechecked on resolution (the ruling).

const ETB_TEXT =
  "When this creature enters, counter target spell with mana value X or less, where X is the number of Faeries you control.";

export default defineCard({
  name: "Spellstutter Sprite",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Faerie", "Wizard"],
  power: 1,
  toughness: 1,
  keywords: ["flash", "flying"],
  text: `Flash\nFlying\n${ETB_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [
        {
          kind: "spell",
          filter: {
            manaValue: { op: "lte", n: { amount: { countOf: { subtype: "Faerie", controlledBy: "you" } } } },
          },
        },
      ],
      effect: { kind: "counter", target: 0 },
      resolve: null,
      text: ETB_TEXT,
    },
  ],
});
