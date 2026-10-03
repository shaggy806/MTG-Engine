import { defineCard } from "../define.js";

const ENTERS_TEXT =
  "When this creature enters, copy target instant or sorcery spell. You may choose new targets for the copy.";

// Any instant or sorcery spell, whoever controls it and whether or not it has
// targets (the rulings). The copy is Dualcaster's controller's: "you" in it
// is them.
export default defineCard({
  name: "Dualcaster Mage",
  manaCost: "{1}{R}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Human", "Wizard"],
  power: 2,
  toughness: 2,
  keywords: ["flash"],
  text: `Flash\n${ENTERS_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["instant-or-sorcery-spell"],
      effect: { kind: "copy-spell", target: 0, newTargets: true },
      resolve: null,
      text: ENTERS_TEXT,
    },
  ],
});
