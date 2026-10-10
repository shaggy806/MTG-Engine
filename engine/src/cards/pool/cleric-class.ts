import { defineCard } from "../define.js";
import { atLevel, classLevel } from "../helpers.js";

// EDHREC rank 1452. A Class (rule 716): each level bar is a sorcery-speed
// activated ability from the level below, and the abilities under it are
// gated on the level (`atLevel`). Its last level's life is the returned creature's toughness, read once it's on the battlefield.
export default defineCard({
  name: "Cleric Class",
  manaCost: "{W}",
  colors: ["W"],
  types: ["enchantment"],
  subtypes: ["Class"],
  text: "(Gain the next level as a sorcery to add its ability.)\nIf you would gain life, you gain that much life plus 1 instead.\n{3}{W}: Level 2\nWhenever you gain life, put a +1/+1 counter on target creature you control.\n{4}{W}: Level 3\nWhen this Class becomes level 3, return target creature card from your graveyard to the battlefield. You gain life equal to that creature's toughness.",
  static: [
    { affects: { scope: "self" }, replacement: { event: "would-gain-life", who: "you", plus: 1 }, text: "If you would gain life, you gain that much life plus 1 instead." },
  ],
  triggered: [
    atLevel(2, { trigger: { on: "gains-life", who: "you" }, targets: ["creature-you-control"], effect: { kind: "add-counter", target: 0, counter: "+1/+1", amount: 1 }, resolve: null, text: "Whenever you gain life, put a +1/+1 counter on target creature you control." }),
    atLevel(3, { trigger: { on: "class-level-gained", who: "self", level: 3 }, targets: [{ kind: "card-in-graveyard", whose: "you", filter: { type: "creature" } }], effect: { kind: "sequence", effects: [{ kind: "put-onto-battlefield", target: 0 }, { kind: "gain-life", amount: { toughnessOf: 0 } }] }, resolve: null, text: "When this Class becomes level 3, return target creature card from your graveyard to the battlefield. You gain life equal to that creature's toughness." }),
  ],
  activated: [
    classLevel(2, "{3}{W}"),
    classLevel(3, "{4}{W}"),
  ],
});
