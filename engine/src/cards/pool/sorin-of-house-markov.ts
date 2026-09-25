import { defineCard } from "../define.js";
import { extort } from "../helpers.js";

// #467 in top-commanders.txt. Transforms into Sorin, Ravenous Neonate.
//
// "If you gained 3 or more life this turn" is the intervening-if; the
// return is a flicker that brings him back transformed, with the back face's
// loyalty.
const EXTORT_TEXT =
  "Extort (Whenever you cast a spell, you may pay {W/B}. If you do, each opponent loses 1 life and you gain that much life.)";
const FLIP_TEXT =
  "At the beginning of each of your postcombat main phases, if you gained 3 or more life this turn, " +
  "exile Sorin, then return him to the battlefield transformed under his owner's control.";

export default defineCard({
  name: "Sorin of House Markov",
  manaCost: "{1}{B}",
  colors: ["B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Noble"],
  power: 1,
  toughness: 4,
  keywords: ["lifelink"],
  text: `Lifelink\n${EXTORT_TEXT}\n${FLIP_TEXT}`,
  triggered: [
    extort(),
    {
      trigger: { on: "step-begins", step: "postcombat-main", who: "you" },
      condition: { kind: "turn-stat", stat: "life-gained", who: "you", atLeast: 3 },
      targets: [],
      effect: { kind: "flicker", target: "source", transformed: true },
      resolve: null,
      text: FLIP_TEXT,
    },
  ],
  faces: ["Sorin of House Markov", "Sorin, Ravenous Neonate"],
  transform: true,
});
