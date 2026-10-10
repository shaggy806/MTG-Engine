import { defineCard } from "../define.js";
import { atLevel, classLevel } from "../helpers.js";

// EDHREC rank 3617. A Class (rule 716): each level bar is a sorcery-speed
// activated ability from the level below, and the abilities under it are
// gated on the level (`atLevel`).
export default defineCard({
  name: "Hunter's Talent",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["enchantment"],
  subtypes: ["Class"],
  text: "(Gain the next level as a sorcery to add its ability.)\nWhen this Class enters, target creature you control deals damage equal to its power to target creature you don't control.\n{1}{G}: Level 2\nWhenever you attack, target attacking creature gets +1/+0 and gains trample until end of turn.\n{3}{G}: Level 3\nAt the beginning of your end step, if you control a creature with power 4 or greater, draw a card.",
  triggered: [
    { trigger: { on: "enters-battlefield", who: "self" }, targets: ["creature-you-control", "creature-an-opponent-controls"], effect: { kind: "fight", a: 0, b: 1, oneSided: true }, resolve: null, text: "When this Class enters, target creature you control deals damage equal to its power to target creature you don't control." },
    atLevel(2, { trigger: { on: "attack-with", who: "you", atLeast: 1 }, targets: [{ kind: "permanent", filter: { type: "creature", attacking: true } }], effect: { kind: "sequence", effects: [{ kind: "modify-pt", target: 0, power: 1, toughness: 0, duration: "end-of-turn" }, { kind: "grant-keyword", target: 0, keyword: "trample", duration: "end-of-turn" }] }, resolve: null, text: "Whenever you attack, target attacking creature gets +1/+0 and gains trample until end of turn." }),
    atLevel(3, { trigger: { on: "step-begins", step: "end", who: "you" }, targets: [], effect: { kind: "draw", amount: 1 }, resolve: null, text: "At the beginning of your end step, if you control a creature with power 4 or greater, draw a card.", condition: { kind: "controls", filter: { type: "creature", power: { op: "gte", n: 4 } }, atLeast: 1 } }),
  ],
  activated: [
    classLevel(2, "{1}{G}"),
    classLevel(3, "{3}{G}"),
  ],
});
