import { defineCard } from "../define.js";

const CAST_TEXT = "Whenever you cast a creature spell, choose one —";
const DESTROY_MODE = "Destroy target artifact or enchantment.";
const LAND_MODE =
  "Look at the top five cards of your library. You may put a land card from among them onto the battlefield tapped. Put the rest on the bottom of your library in a random order.";
const LIFE_MODE = "You gain 4 life.";

// Resolves before the creature spell, and even if that spell is countered
// (the ruling).
export default defineCard({
  name: "Silverback Elder",
  manaCost: "{2}{G}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Ape", "Shaman"],
  power: 5,
  toughness: 7,
  text: `${CAST_TEXT}\n• ${DESTROY_MODE}\n• ${LAND_MODE}\n• ${LIFE_MODE}`,
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", filter: { type: "creature" } },
      targets: [],
      effect: {
        kind: "modal",
        announced: true,
        minModes: 1,
        maxModes: 1,
        modes: [
          { text: DESTROY_MODE, targets: ["artifact-or-enchantment"], effect: { kind: "destroy", target: 0 } },
          {
            text: LAND_MODE,
            effect: {
              kind: "look-and-choose",
              zone: "library",
              count: 5,
              min: 0,
              max: 1,
              filter: { type: "land" },
              destination: "battlefield",
              enterTapped: true,
              leftover: "bottom-random",
            },
          },
          { text: LIFE_MODE, effect: { kind: "gain-life", amount: 4 } },
        ],
      },
      resolve: null,
      text: `${CAST_TEXT} ${DESTROY_MODE} ${LAND_MODE} ${LIFE_MODE}`,
    },
  ],
});
