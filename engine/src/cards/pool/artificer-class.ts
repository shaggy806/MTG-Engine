import { defineCard } from "../define.js";
import { atLevel, classLevel } from "../helpers.js";

// EDHREC rank 4108. A Class (rule 716): each level bar is a sorcery-speed
// activated ability from the level below, and the abilities under it are
// gated on the level (`atLevel`).
export default defineCard({
  name: "Artificer Class",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["enchantment"],
  subtypes: ["Class"],
  text: "(Gain the next level as a sorcery to add its ability.)\nThe first artifact spell you cast each turn costs {1} less to cast.\n{1}{U}: Level 2\nWhen this Class becomes level 2, reveal cards from the top of your library until you reveal an artifact card. Put that card into your hand and the rest on the bottom of your library in a random order.\n{5}{U}: Level 3\nAt the beginning of your end step, create a token that's a copy of target artifact you control.",
  static: [
    { affects: { scope: "self" }, costModification: { applies: { type: "artifact" }, caster: "you", reduceGeneric: 1, firstEachTurn: true }, text: "The first artifact spell you cast each turn costs {1} less to cast." },
  ],
  triggered: [
    atLevel(2, { trigger: { on: "class-level-gained", who: "self", level: 2 }, targets: [], effect: { kind: "reveal-until", filter: { type: "artifact" }, put: "hand", rest: "bottom-random" }, resolve: null, text: "When this Class becomes level 2, reveal cards from the top of your library until you reveal an artifact card. Put that card into your hand and the rest on the bottom of your library in a random order." }),
    atLevel(3, { trigger: { on: "step-begins", step: "end", who: "you" }, targets: [{ kind: "permanent", whose: "you", filter: { type: "artifact" } }], effect: { kind: "create-token-copy", of: 0, count: 1, who: "you" }, resolve: null, text: "At the beginning of your end step, create a token that's a copy of target artifact you control." }),
  ],
  activated: [
    classLevel(2, "{1}{U}"),
    classLevel(3, "{5}{U}"),
  ],
});
