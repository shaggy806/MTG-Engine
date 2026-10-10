import { defineCard } from "../define.js";
import { ninjutsu, ninjutsuText } from "../helpers.js";

// EDHREC rank 5231.
const HIT = "Whenever this creature deals combat damage to a player, create a token that's a copy of this creature.";

export default defineCard({
  name: "Mist-Syndicate Naga",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Snake", "Ninja"],
  power: 3,
  toughness: 1,
  text: `${ninjutsuText("{2}{U}")}\n${HIT}`,
  activated: [ninjutsu("{2}{U}")],
  triggered: [
    {
      trigger: { on: "deals-combat-damage-to-player", who: "self" },
      targets: [],
      effect: { kind: "create-token-copy", of: "source", count: 1 },
      resolve: null,
      text: HIT,
    },
  ],
});
