import { defineCard } from "../define.js";

const ANTHEM_TEXT = "Creatures you control get +1/+1.";
const MANA_TEXT = "Whenever you tap a land for mana, add one mana of any type that land produced.";

// A triggered mana ability (rule 605.1b): off the stack, at once, counted by
// the auto-payer. A land that made more than one type — a Karoo's {W}{U} —
// leaves the choice of which to the player (the ruling): by hand it's a pick
// with the activation's others. The extra mana carries none of the land's
// restrictions or riders (the ruling).
export default defineCard({
  name: "Mirari's Wake",
  manaCost: "{3}{G}{W}",
  colors: ["W", "G"],
  types: ["enchantment"],
  text: `${ANTHEM_TEXT}\n${MANA_TEXT}`,
  static: [
    {
      affects: { scope: "creatures-you-control" },
      grantPt: [1, 1],
      text: ANTHEM_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "tapped-for-mana", who: "you-control", filter: { type: "land" } },
      targets: [],
      effect: { kind: "add-mana", mana: "produced", amount: 1 },
      resolve: null,
      text: MANA_TEXT,
    },
  ],
});
