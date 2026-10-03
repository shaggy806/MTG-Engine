import { defineCard } from "../define.js";

// #225 in top-commanders.txt.
//
// One trigger per discarded card, acting only while it's still that card in
// its owner's graveyard (rule 400.7). The play permission reads the stash
// counter, so it reaches cards an earlier Tinybones exiled too (the ruling),
// but only ones you don't own, only during your turn, and only while a
// Tinybones is around; lands take the land drop and spells keep their timing
// (the ruling). Mana of any type pays only for a spell cast this way (rule
// 118.14).
const EXILE_TEXT = "Whenever an opponent discards a card, exile it from their graveyard with a stash counter on it.";
const PLAY_TEXT =
  "During your turn, you may play cards you don't own with stash counters on them from exile, and mana of any type can be spent to cast those spells.";
const DISCARD_TEXT = "{3}{B}, {T}: Each opponent discards a card. Activate only as a sorcery.";

export default defineCard({
  name: "Tinybones, Bauble Burglar",
  manaCost: "{1}{B}",
  colors: ["B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Skeleton", "Rogue"],
  power: 1,
  toughness: 3,
  text: `${EXILE_TEXT}\n${PLAY_TEXT}\n${DISCARD_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      playFromExile: {
        filter: { ownedBy: "opponent", counters: { kind: "stash", compare: { op: "gte", n: 1 } } },
        yourTurnOnly: true,
        spendAs: "any-type",
      },
      text: PLAY_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "discards", who: "opponent", perCard: true },
      targets: [],
      effect: { kind: "exile", target: "trigger-object", withCounters: { kind: "stash", amount: 1 } },
      resolve: null,
      text: EXILE_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: "{3}{B}", tap: true },
      targets: [],
      effect: { kind: "discard", target: "each-opponent", amount: 1 },
      resolve: null,
      text: DISCARD_TEXT,
      sorcerySpeed: true,
    },
  ],
});
