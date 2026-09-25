import { defineCard } from "../define.js";
import { extort } from "../helpers.js";

export default defineCard({
  name: "Crypt Ghast",
  manaCost: "{3}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Spirit"],
  power: 2,
  toughness: 2,
  text:
    "Extort (Whenever you cast a spell, you may pay {W/B}. If you do, each opponent loses 1 life and you gain that much life.)\n" +
    "Whenever you tap a Swamp for mana, add an additional {B}.",
  triggered: [
    extort(),
    {
      // A triggered mana ability (rule 605.1b): applied as the Swamp's mana is
      // made, never on the stack, and counted by the auto-payer.
      trigger: { on: "tapped-for-mana", who: "you-control", filter: { subtype: "Swamp" } },
      targets: [],
      effect: { kind: "add-mana", mana: "B", amount: 1 },
      resolve: null,
      text: "Whenever you tap a Swamp for mana, add an additional {B}.",
    },
  ],
});
