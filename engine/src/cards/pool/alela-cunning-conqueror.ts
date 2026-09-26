import { defineCard } from "../define.js";

// #103 in top-commanders.txt.
//
// "Your first spell during each opponent's turn" is your first spell of a
// turn that isn't yours: `firstEachTurn`, with the turn asked as an
// intervening-if. The turn can't change while the ability waits on the
// stack, so asking again as it resolves changes nothing. "That player" is
// the player the Faeries dealt combat damage to — the batch trigger's
// `trigger-player`, whose creatures are the only legal targets.
const FAERIE_TEXT =
  "Whenever you cast your first spell during each opponent's turn, create a 1/1 black Faerie Rogue creature " +
  "token with flying.";
const GOAD_TEXT =
  "Whenever one or more Faeries you control deal combat damage to a player, goad target creature that player controls.";

export default defineCard({
  name: "Alela, Cunning Conqueror",
  manaCost: "{2}{U}{B}",
  colors: ["U", "B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Faerie", "Warlock"],
  power: 2,
  toughness: 4,
  keywords: ["flying"],
  text: `Flying\n${FAERIE_TEXT}\n${GOAD_TEXT}`,
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", firstEachTurn: true },
      condition: { kind: "not", of: { kind: "your-turn" } },
      targets: [],
      effect: { kind: "create-token", token: "Faerie Rogue Token", count: 1 },
      resolve: null,
      text: FAERIE_TEXT,
    },
    {
      trigger: { on: "deals-damage-batch", who: "you-control", filter: { subtype: "Faerie" }, combat: true },
      targets: [{ kind: "permanent", whose: "trigger-player", filter: { type: "creature" } }],
      effect: { kind: "goad", target: 0 },
      resolve: null,
      text: GOAD_TEXT,
    },
  ],
});
