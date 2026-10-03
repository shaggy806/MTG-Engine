import { defineCard } from "../define.js";
import { equip } from "../helpers.js";

const HASTE_TEXT = "Equipped creature has haste.";
const COPY_TEXT =
  "Whenever an ability of equipped creature is activated, if it isn't a mana ability, you may pay {1}. If you " +
  "do, copy that ability. You may choose new targets for the copy.";

// The rulings this follows: the copy keeps the ability's X and modes, and may
// get new targets; the Bracers' controller controls it and pays the {1},
// whoever controls the creature; an ability whose cost sacrificed the
// creature or the Bracers isn't seen — once its costs are paid, the Bracers
// equips nothing (`activates-ability`). A mana ability never uses the stack,
// so never triggers it.
export default defineCard({
  name: "Battlemage's Bracers",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["artifact"],
  subtypes: ["Equipment"],
  text: `${HASTE_TEXT}\n${COPY_TEXT}\nEquip {2}`,
  static: [
    {
      affects: { scope: "attached" },
      grantKeywords: ["haste"],
      text: HASTE_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "activates-ability", who: "attached" },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Pay {1} to copy that ability?",
        cost: "{1}",
        effect: { kind: "copy-ability", target: "trigger-ability", newTargets: true },
      },
      resolve: null,
      text: COPY_TEXT,
    },
  ],
  activated: [equip("{2}")],
});
