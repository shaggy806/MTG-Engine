import { defineCard } from "../define.js";
import { ninjutsu, ninjutsuText } from "../helpers.js";

// EDHREC rank 2076. "That player exiles" from their own library; the
// permission is this creature's controller's, lands included ("play"), and
// only without paying their mana costs.
const HIT =
  "Whenever this creature deals combat damage to a player, that player exiles the top two cards of their library. Until end of turn, you may play those cards without paying their mana costs.";

export default defineCard({
  name: "Fallen Shinobi",
  manaCost: "{3}{U}{B}",
  colors: ["U", "B"],
  types: ["creature"],
  subtypes: ["Zombie", "Ninja"],
  power: 5,
  toughness: 4,
  text: `${ninjutsuText("{2}{U}{B}")}\n${HIT}`,
  activated: [ninjutsu("{2}{U}{B}")],
  triggered: [
    {
      trigger: { on: "deals-combat-damage-to-player", who: "self" },
      targets: [],
      effect: {
        kind: "impulse-exile",
        amount: 2,
        whose: "trigger-player",
        duration: "end-of-turn",
        free: { only: true },
      },
      resolve: null,
      text: HIT,
    },
  ],
});
