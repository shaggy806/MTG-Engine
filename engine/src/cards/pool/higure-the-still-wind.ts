import { defineCard } from "../define.js";
import { ninjutsu, ninjutsuText } from "../helpers.js";

// EDHREC rank 5642.
const HIT =
  "Whenever Higure deals combat damage to a player, you may search your library for a Ninja card, reveal it, put it into your hand, then shuffle.";
const SNEAK = "{2}: Target Ninja creature can't be blocked this turn.";

export default defineCard({
  name: "Higure, the Still Wind",
  manaCost: "{3}{U}{U}",
  colors: ["U"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Ninja"],
  power: 3,
  toughness: 4,
  text: `${ninjutsuText("{2}{U}{U}")}\n${HIT}\n${SNEAK}`,
  activated: [
    ninjutsu("{2}{U}{U}"),
    {
      cost: { mana: "{2}", tap: false },
      targets: [{ kind: "permanent", filter: { type: "creature", subtype: "Ninja" } }],
      effect: { kind: "grant-keyword", target: 0, keyword: "unblockable", duration: "end-of-turn" },
      resolve: null,
      text: SNEAK,
    },
  ],
  triggered: [
    {
      trigger: { on: "deals-combat-damage-to-player", who: "self" },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Search your library for a Ninja card?",
        effect: { kind: "search-library", filter: { subtype: "Ninja" }, destination: "hand", min: 0, max: 1, reveal: true },
      },
      resolve: null,
      text: HIT,
    },
  ],
});
