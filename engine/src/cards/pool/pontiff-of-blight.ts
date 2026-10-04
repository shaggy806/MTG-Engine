import { defineCard } from "../define.js";
import { extort } from "../helpers.js";

// EDHREC rank 5949.
//
// Rulings:
//   [2024-01-12] The amount of life you gain from extort is based on the total amount of life
//     lost, not necessarily the number of opponents you have. For example, if your opponent's life
//     total can't change (perhaps because that player controls Platinum Emperion), you won't gain
//     any life.
//   [2024-01-12] The extort ability doesn't target any player.
//   [2024-01-12] You may pay {W/B} a maximum of one time for each extort triggered ability. You
//     decide whether to pay when the ability resolves.
//   [2024-01-12] The extort ability resolves before the spell that caused it to trigger. The
//     ability resolves even if that spell is countered.
//
// The `extort()` helper, printed and granted (Marchesa's dethrone shape): each
// creature's own instance is "whenever you cast a spell" for its controller,
// and each triggers separately.
const EXTORT_TEXT =
  "Extort (Whenever you cast a spell, you may pay {W/B}. If you do, each opponent loses 1 life and you gain that much life.)";
const GRANT_TEXT =
  "Other creatures you control have extort. (If a creature has multiple instances of extort, each triggers separately.)";

export default defineCard({
  name: "Pontiff of Blight",
  manaCost: "{4}{B}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Zombie", "Cleric"],
  power: 2,
  toughness: 7,
  text: `${EXTORT_TEXT}\n${GRANT_TEXT}`,
  triggered: [extort()],
  static: [
    {
      affects: { scope: "creatures-you-control", excludeSelf: true },
      grantsTriggered: [extort()],
      text: GRANT_TEXT,
    },
  ],
});
