import { defineCard } from "../define.js";
import { extort } from "../helpers.js";

// Extort gains the life the opponents actually lost (2024-01-12 ruling).
const EXTORT_TEXT =
  "Extort (Whenever you cast a spell, you may pay {W/B}. If you do, each opponent loses 1 life and you gain that much life.)";
const TAPPED_TEXT = "Artifacts and creatures your opponents control enter tapped.";

export default defineCard({
  name: "Blind Obedience",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["enchantment"],
  text: `${EXTORT_TEXT}\n${TAPPED_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      replacement: {
        event: "others-enter-battlefield",
        filter: { typesAnyOf: ["artifact", "creature"], controlledBy: "opponent" },
        tapped: true,
      },
      text: TAPPED_TEXT,
    },
  ],
  triggered: [extort()],
});
