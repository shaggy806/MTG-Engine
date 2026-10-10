import { defineCard } from "../define.js";
import { ninjutsu, ninjutsuText } from "../helpers.js";

// EDHREC rank 3576.
const DRAW = "Whenever this creature deals combat damage to a player, you may draw a card.";

export default defineCard({
  name: "Ninja of the Deep Hours",
  manaCost: "{3}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Human", "Ninja"],
  power: 2,
  toughness: 2,
  text: `${ninjutsuText("{1}{U}")}\n${DRAW}`,
  activated: [ninjutsu("{1}{U}")],
  triggered: [
    {
      trigger: { on: "deals-combat-damage-to-player", who: "self" },
      targets: [],
      effect: { kind: "may", prompt: "Draw a card?", effect: { kind: "draw", amount: 1 } },
      resolve: null,
      text: DRAW,
    },
  ],
});
