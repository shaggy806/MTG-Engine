import { defineCard } from "../define.js";
import { extort } from "../helpers.js";

// Extort gains the life the opponents actually lost (2024-01-12 ruling). The
// Swamp ability is a triggered mana ability (rule 605.1b): off the stack, and
// the auto-payer counts the extra {B}.
const EXTORT_TEXT =
  "Extort (Whenever you cast a spell, you may pay {W/B}. If you do, each opponent loses 1 life and you gain that much life.)";
const MANA_TEXT = "Whenever you tap a Swamp for mana, add an additional {B}.";

export default defineCard({
  name: "Crypt Ghast",
  manaCost: "{3}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Spirit"],
  power: 2,
  toughness: 2,
  text: `${EXTORT_TEXT}\n${MANA_TEXT}`,
  triggered: [
    extort(),
    {
      trigger: { on: "tapped-for-mana", who: "you-control", filter: { subtype: "Swamp" } },
      targets: [],
      effect: { kind: "add-mana", mana: "B", amount: 1 },
      resolve: null,
      text: MANA_TEXT,
    },
  ],
});
