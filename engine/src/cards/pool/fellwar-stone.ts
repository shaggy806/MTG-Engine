import { defineCard } from "../define.js";

/** The colour list is read off the opponents' lands rather than printed —
 * see the `add-mana` effect's `producedBy`. */
export default defineCard({
  name: "Fellwar Stone",
  manaCost: "{2}",
  types: ["artifact"],
  text: "{T}: Add one mana of any color that a land an opponent controls could produce.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: { producedBy: "opponents-lands" }, amount: 1 },
      resolve: null,
      text: "{T}: Add one mana of any color that a land an opponent controls could produce.",
    },
  ],
});
