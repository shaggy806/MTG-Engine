import { defineCard } from "../define.js";
import { atLevel, classLevel } from "../helpers.js";

// EDHREC rank 634. A Class (rule 716): each level bar is a sorcery-speed
// activated ability from the level below, and the abilities under it are
// gated on the level (`atLevel`).
export default defineCard({
  name: "Wizard Class",
  manaCost: "{U}",
  colors: ["U"],
  types: ["enchantment"],
  subtypes: ["Class"],
  text: "(Gain the next level as a sorcery to add its ability.)\nYou have no maximum hand size.\n{2}{U}: Level 2\nWhen this Class becomes level 2, draw two cards.\n{4}{U}: Level 3\nWhenever you draw a card, put a +1/+1 counter on target creature you control.",
  static: [
    { affects: { scope: "self" }, noMaxHandSize: true, text: "You have no maximum hand size." },
  ],
  triggered: [
    atLevel(2, { trigger: { on: "class-level-gained", who: "self", level: 2 }, targets: [], effect: { kind: "draw", amount: 2 }, resolve: null, text: "When this Class becomes level 2, draw two cards." }),
    atLevel(3, { trigger: { on: "draws", who: "you" }, targets: ["creature-you-control"], effect: { kind: "add-counter", target: 0, counter: "+1/+1", amount: 1 }, resolve: null, text: "Whenever you draw a card, put a +1/+1 counter on target creature you control." }),
  ],
  activated: [
    classLevel(2, "{2}{U}"),
    classLevel(3, "{4}{U}"),
  ],
});
