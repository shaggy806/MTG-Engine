import { defineCard } from "../define.js";
import { atLevel, classLevel } from "../helpers.js";

// EDHREC rank 4695. A Class (rule 716): each level bar is a sorcery-speed
// activated ability from the level below, and the abilities under it are
// gated on the level (`atLevel`). Its last level's search is for
// "a card", no quality, so it must find one if it can (rule 701.23d).
export default defineCard({
  name: "Cool but Rude",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["enchantment"],
  subtypes: ["Class"],
  text: "(Gain the next level as a sorcery to add its ability.)\nWhenever you attack, you may discard a card. If you do, draw a card.\n{1}{R}: Level 2\nWhenever you discard a card, this Class deals 2 damage to each opponent.\n{1}{R}: Level 3\nWhen this Class becomes level 3, search your library for a card, put it into your hand, shuffle, then discard a card at random.",
  triggered: [
    { trigger: { on: "attack-with", who: "you", atLeast: 1 }, targets: [], effect: { kind: "may", prompt: "Discard a card to draw a card?", effect: { kind: "sequence", effects: [{ kind: "discard", target: "you", amount: 1 }, { kind: "conditional", condition: { kind: "this-way", what: "discarded" }, then: { kind: "draw", amount: 1 } }] } }, resolve: null, text: "Whenever you attack, you may discard a card. If you do, draw a card." },
    atLevel(2, { trigger: { on: "discards", who: "you", perCard: true }, targets: [], effect: { kind: "damage", amount: 2, who: "each-opponent" }, resolve: null, text: "Whenever you discard a card, this Class deals 2 damage to each opponent." }),
    atLevel(3, { trigger: { on: "class-level-gained", who: "self", level: 3 }, targets: [], effect: { kind: "sequence", effects: [{ kind: "search-library", filter: {}, destination: "hand", min: 1, max: 1 }, { kind: "discard", target: "you", amount: 1, random: true }] }, resolve: null, text: "When this Class becomes level 3, search your library for a card, put it into your hand, shuffle, then discard a card at random." }),
  ],
  activated: [
    classLevel(2, "{1}{R}"),
    classLevel(3, "{1}{R}"),
  ],
});
