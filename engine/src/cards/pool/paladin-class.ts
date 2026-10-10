import { defineCard } from "../define.js";
import { atLevel, classLevel } from "../helpers.js";

// EDHREC rank 4732. A Class (rule 716): each level bar is a sorcery-speed
// activated ability from the level below, and the abilities under it are
// gated on the level (`atLevel`). The last level's "for each other attacking creature" is counted as it resolves, the target among them.
export default defineCard({
  name: "Paladin Class",
  manaCost: "{W}",
  colors: ["W"],
  types: ["enchantment"],
  subtypes: ["Class"],
  text: "(Gain the next level as a sorcery to add its ability.)\nSpells your opponents cast during your turn cost {1} more to cast.\n{2}{W}: Level 2\nCreatures you control get +1/+1.\n{4}{W}: Level 3\nWhenever you attack, until end of turn, target attacking creature gets +1/+1 for each other attacking creature and gains double strike.",
  static: [
    { affects: { scope: "self" }, condition: { kind: "your-turn" }, costModification: { applies: {}, caster: "opponent", increaseGeneric: 1 }, text: "Spells your opponents cast during your turn cost {1} more to cast." },
    atLevel(2, { affects: { scope: "creatures-you-control" }, grantPt: [1, 1], text: "Creatures you control get +1/+1." }),
  ],
  triggered: [
    atLevel(3, { trigger: { on: "attack-with", who: "you", atLeast: 1 }, targets: [{ kind: "permanent", filter: { type: "creature", attacking: true } }], effect: { kind: "sequence", effects: [{ kind: "modify-pt", target: 0, power: { difference: [{ countOf: { type: "creature", attacking: true } }, 1] }, toughness: { difference: [{ countOf: { type: "creature", attacking: true } }, 1] }, duration: "end-of-turn" }, { kind: "grant-keyword", target: 0, keyword: "double-strike", duration: "end-of-turn" }] }, resolve: null, text: "Whenever you attack, until end of turn, target attacking creature gets +1/+1 for each other attacking creature and gains double strike." }),
  ],
  activated: [
    classLevel(2, "{2}{W}"),
    classLevel(3, "{4}{W}"),
  ],
});
