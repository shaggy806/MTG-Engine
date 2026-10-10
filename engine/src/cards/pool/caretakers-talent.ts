import { defineCard } from "../define.js";
import { atLevel, classLevel } from "../helpers.js";

// EDHREC rank 631. A Class (rule 716): each level bar is a sorcery-speed
// activated ability from the level below, and the abilities under it are
// gated on the level (`atLevel`).
export default defineCard({
  name: "Caretaker's Talent",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["enchantment"],
  subtypes: ["Class"],
  text: "(Gain the next level as a sorcery to add its ability.)\nWhenever one or more tokens you control enter, draw a card. This ability triggers only once each turn.\n{W}: Level 2\nWhen this Class becomes level 2, create a token that's a copy of target token you control.\n{3}{W}: Level 3\nCreature tokens you control get +2/+2.",
  static: [
    atLevel(3, { affects: { scope: "creatures-you-control", tokenOnly: true }, grantPt: [2, 2], text: "Creature tokens you control get +2/+2." }),
  ],
  triggered: [
    { trigger: { on: "enters-battlefield", who: "you-control", filter: { token: true } }, targets: [], effect: { kind: "draw", amount: 1 }, resolve: null, text: "Whenever one or more tokens you control enter, draw a card. This ability triggers only once each turn.", oncePerTurn: true },
    atLevel(2, { trigger: { on: "class-level-gained", who: "self", level: 2 }, targets: [{ kind: "permanent", whose: "you", filter: { token: true } }], effect: { kind: "create-token-copy", of: 0, count: 1, who: "you" }, resolve: null, text: "When this Class becomes level 2, create a token that's a copy of target token you control." }),
  ],
  activated: [
    classLevel(2, "{W}"),
    classLevel(3, "{3}{W}"),
  ],
});
