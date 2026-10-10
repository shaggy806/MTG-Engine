import { defineCard } from "../define.js";
import { atLevel, classLevel } from "../helpers.js";

// EDHREC rank 5981. A Class (rule 716): each level bar is a sorcery-speed
// activated ability from the level below, and the abilities under it are
// gated on the level (`atLevel`). Ragost, Deft Gastronaut's Food grant, during your turn only.
export default defineCard({
  name: "Gourmand's Talent",
  manaCost: "{G}",
  colors: ["G"],
  types: ["enchantment"],
  subtypes: ["Class"],
  text: "(Gain the next level as a sorcery to add its ability.)\nDuring your turn, artifacts you control are Foods in addition to their other types and have \"{2}, {T}, Sacrifice this artifact: You gain 3 life.\"\n{2}{G}: Level 2\nWhenever you gain life for the first time each turn, create a 3/3 green Raccoon creature token.\n{3}{G}: Level 3\nWhenever you gain life for the first time each turn, put a +1/+1 counter on each creature you control.",
  static: [
    { affects: { scope: "filter", filter: { type: "artifact", controlledBy: "you" } }, condition: { kind: "your-turn" }, addSubtypes: ["Food"], grantsActivated: [{ cost: { mana: "{2}", tap: true, sacrifice: "self" }, targets: [], effect: { kind: "gain-life", amount: 3 }, resolve: null, text: "{2}, {T}, Sacrifice this artifact: You gain 3 life." }], text: "During your turn, artifacts you control are Foods in addition to their other types and have \"{2}, {T}, Sacrifice this artifact: You gain 3 life.\"" },
  ],
  triggered: [
    atLevel(2, { trigger: { on: "gains-life", who: "you", firstTimeEachTurn: true }, targets: [], effect: { kind: "create-token", token: "Raccoon Token", count: 1 }, resolve: null, text: "Whenever you gain life for the first time each turn, create a 3/3 green Raccoon creature token." }),
    atLevel(3, { trigger: { on: "gains-life", who: "you", firstTimeEachTurn: true }, targets: [], effect: { kind: "add-counter-all", filter: { type: "creature", controlledBy: "you" }, counter: "+1/+1", amount: 1 }, resolve: null, text: "Whenever you gain life for the first time each turn, put a +1/+1 counter on each creature you control." }),
  ],
  activated: [
    classLevel(2, "{2}{G}"),
    classLevel(3, "{3}{G}"),
  ],
});
