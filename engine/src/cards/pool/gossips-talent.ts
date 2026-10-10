import { defineCard } from "../define.js";
import { atLevel, classLevel } from "../helpers.js";

// EDHREC rank 4378. A Class (rule 716): each level bar is a sorcery-speed
// activated ability from the level below, and the abilities under it are
// gated on the level (`atLevel`). The last level's flicker returns the creature under its owner's control.
export default defineCard({
  name: "Gossip's Talent",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["enchantment"],
  subtypes: ["Class"],
  text: "(Gain the next level as a sorcery to add its ability.)\nWhenever a creature you control enters, surveil 1.\n{1}{U}: Level 2\nWhenever you attack, target attacking creature with power 3 or less can't be blocked this turn.\n{3}{U}: Level 3\nWhenever a creature you control deals combat damage to a player, you may exile it, then return it to the battlefield under its owner's control.",
  triggered: [
    { trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "creature" } }, targets: [], effect: { kind: "surveil", amount: 1 }, resolve: null, text: "Whenever a creature you control enters, surveil 1." },
    atLevel(2, { trigger: { on: "attack-with", who: "you", atLeast: 1 }, targets: [{ kind: "permanent", filter: { type: "creature", attacking: true, power: { op: "lte", n: 3 } } }], effect: { kind: "grant-keyword", target: 0, keyword: "unblockable", duration: "end-of-turn" }, resolve: null, text: "Whenever you attack, target attacking creature with power 3 or less can't be blocked this turn." }),
    atLevel(3, { trigger: { on: "deals-combat-damage-to-player", who: "you-control", filter: { type: "creature" } }, targets: [], effect: { kind: "may", prompt: "Exile it, then return it to the battlefield?", effect: { kind: "flicker", target: "trigger-object" } }, resolve: null, text: "Whenever a creature you control deals combat damage to a player, you may exile it, then return it to the battlefield under its owner's control." }),
  ],
  activated: [
    classLevel(2, "{1}{U}"),
    classLevel(3, "{3}{U}"),
  ],
});
