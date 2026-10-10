import { defineCard } from "../define.js";
import { atLevel, classLevel } from "../helpers.js";

// EDHREC rank 1557. A Class (rule 716): each level bar is a sorcery-speed
// activated ability from the level below, and the abilities under it are
// gated on the level (`atLevel`).
export default defineCard({
  name: "Artist's Talent",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["enchantment"],
  subtypes: ["Class"],
  text: "(Gain the next level as a sorcery to add its ability.)\nWhenever you cast a noncreature spell, you may discard a card. If you do, draw a card.\n{2}{R}: Level 2\nNoncreature spells you cast cost {1} less to cast.\n{2}{R}: Level 3\nIf a source you control would deal noncombat damage to an opponent or a permanent an opponent controls, it deals that much damage plus 2 instead.",
  static: [
    atLevel(2, { affects: { scope: "self" }, costModification: { applies: { notTypes: ["creature"] }, caster: "you", reduceGeneric: 1 }, text: "Noncreature spells you cast cost {1} less to cast." }),
    atLevel(3, { affects: { scope: "self" }, replacement: { event: "would-deal-damage", plus: 2, combat: false, to: "opponent-side", source: { controlledBy: "you" } }, text: "If a source you control would deal noncombat damage to an opponent or a permanent an opponent controls, it deals that much damage plus 2 instead." }),
  ],
  triggered: [
    { trigger: { on: "cast-spell", who: "you", noncreatureOnly: true }, targets: [], effect: { kind: "may", prompt: "Discard a card to draw a card?", effect: { kind: "sequence", effects: [{ kind: "discard", target: "you", amount: 1 }, { kind: "conditional", condition: { kind: "this-way", what: "discarded" }, then: { kind: "draw", amount: 1 } }] } }, resolve: null, text: "Whenever you cast a noncreature spell, you may discard a card. If you do, draw a card." },
  ],
  activated: [
    classLevel(2, "{2}{R}"),
    classLevel(3, "{2}{R}"),
  ],
});
