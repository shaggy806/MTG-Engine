import { defineCard } from "../define.js";
import { atLevel, classLevel } from "../helpers.js";

// EDHREC rank 3778. A Class (rule 716): each level bar is a sorcery-speed
// activated ability from the level below, and the abilities under it are
// gated on the level (`atLevel`).
export default defineCard({
  name: "Blacksmith's Talent",
  manaCost: "{R}",
  colors: ["R"],
  types: ["enchantment"],
  subtypes: ["Class"],
  text: "(Gain the next level as a sorcery to add its ability.)\nWhen this Class enters, create a colorless Equipment artifact token named Sword with \"Equipped creature gets +1/+1\" and equip {2}.\n{2}{R}: Level 2\nAt the beginning of combat on your turn, attach target Equipment you control to up to one target creature you control.\n{3}{R}: Level 3\nDuring your turn, equipped creatures you control have double strike and haste.",
  static: [
    atLevel(3, { affects: { scope: "filter", filter: { type: "creature", controlledBy: "you", equipped: true } }, condition: { kind: "your-turn" }, grantKeywords: ["double-strike", "haste"], text: "During your turn, equipped creatures you control have double strike and haste." }),
  ],
  triggered: [
    { trigger: { on: "enters-battlefield", who: "self" }, targets: [], effect: { kind: "create-token", token: "Sword Token", count: 1 }, resolve: null, text: "When this Class enters, create a colorless Equipment artifact token named Sword with \"Equipped creature gets +1/+1\" and equip {2}." },
    atLevel(2, { trigger: { on: "step-begins", step: "begin-combat", who: "you" }, targets: [{ kind: "permanent", whose: "you", filter: { subtype: "Equipment" } }, { kind: "optional", of: "creature-you-control" }], effect: { kind: "attach", target: 1, attachment: 0 }, resolve: null, text: "At the beginning of combat on your turn, attach target Equipment you control to up to one target creature you control." }),
  ],
  activated: [
    classLevel(2, "{2}{R}"),
    classLevel(3, "{3}{R}"),
  ],
});
