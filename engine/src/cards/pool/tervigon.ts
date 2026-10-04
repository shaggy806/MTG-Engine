import { defineCard } from "../define.js";
import { ravenous } from "../helpers.js";

// EDHREC rank 5850.
//
// Ravenous is the `ravenous()` helper (Jacked Rabbit). "That many" is the
// combat damage it just dealt (Gishath, Sun's Avatar's `triggerValue`).

const RAVENOUS = ravenous();
const SPAWN_TEXT =
  "Spawn Termagants — Whenever this creature deals combat damage to a player, create that many 1/1 green Tyranid creature tokens.";

export default defineCard({
  name: "Tervigon",
  manaCost: "{X}{1}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Tyranid"],
  power: 0,
  toughness: 0,
  keywords: ["trample"],
  text:
    "Ravenous (This creature enters with X +1/+1 counters on it. If X is 5 or more, draw a card when it enters.)\nTrample\n" +
    SPAWN_TEXT,
  static: [RAVENOUS.static],
  triggered: [
    RAVENOUS.triggered,
    {
      trigger: { on: "deals-combat-damage-to-player", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Tyranid Token", count: { triggerValue: true } },
      resolve: null,
      text: SPAWN_TEXT,
    },
  ],
});
