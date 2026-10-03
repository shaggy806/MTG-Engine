import { defineCard } from "../define.js";
import { equip } from "../helpers.js";

const TEXT =
  "Whenever an ability of equipped creature is activated, if it isn't a mana ability, copy that ability. You may " +
  "choose new targets for the copy.";

// The rulings this follows: the copy keeps the ability's X and mode; the
// Bracers' controller controls it, whoever controls the creature; and an
// ability whose cost sacrifices the creature or the Bracers isn't copied —
// once its costs are paid, the Bracers equips nothing (`activates-ability`).
// A mana ability never uses the stack, so never triggers it.
export default defineCard({
  name: "Illusionist's Bracers",
  manaCost: "{2}",
  colors: [],
  types: ["artifact"],
  subtypes: ["Equipment"],
  text: `${TEXT}\nEquip {3}`,
  triggered: [
    {
      trigger: { on: "activates-ability", who: "attached" },
      targets: [],
      effect: { kind: "copy-ability", target: "trigger-ability", newTargets: true },
      resolve: null,
      text: TEXT,
    },
  ],
  activated: [equip("{3}")],
});
