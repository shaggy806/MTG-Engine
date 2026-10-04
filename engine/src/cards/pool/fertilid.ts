import { defineCard } from "../define.js";

// EDHREC rank 3053.
//
// The target player needn't find a basic land, but shuffles either way (the
// ruling) — Assassin's Trophy's `who: { controllerOfTarget }`, a player slot
// naming that player.
const ENTER_TEXT = "This creature enters with two +1/+1 counters on it.";
const SEARCH_TEXT =
  "{1}{G}, Remove a +1/+1 counter from this creature: Target player searches their library for a basic land card, puts it onto the battlefield tapped, then shuffles.";

export default defineCard({
  name: "Fertilid",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Elemental"],
  power: 0,
  toughness: 0,
  text: `${ENTER_TEXT}\n${SEARCH_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "enters-battlefield", counters: { kind: "+1/+1", amount: 2 } },
      text: ENTER_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: "{1}{G}", tap: false, removeCounter: { kind: "+1/+1", count: 1 } },
      targets: ["player"],
      effect: {
        kind: "search-library",
        who: { controllerOfTarget: 0 },
        filter: { supertype: "basic", type: "land" },
        destination: "battlefield",
        enterTapped: true,
        min: 0,
        max: 1,
      },
      resolve: null,
      text: SEARCH_TEXT,
    },
  ],
});
