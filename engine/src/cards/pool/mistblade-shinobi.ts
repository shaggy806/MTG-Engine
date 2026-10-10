import { defineCard } from "../define.js";
import { ninjutsu, ninjutsuText } from "../helpers.js";

// EDHREC rank 3271.
const HIT = "Whenever this creature deals combat damage to a player, you may return target creature that player controls to its owner's hand.";

export default defineCard({
  name: "Mistblade Shinobi",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Human", "Ninja"],
  power: 1,
  toughness: 1,
  text: `${ninjutsuText("{U}")}\n${HIT}`,
  activated: [ninjutsu("{U}")],
  triggered: [
    {
      trigger: { on: "deals-combat-damage-to-player", who: "self" },
      targets: [{ kind: "permanent", whose: "trigger-player", filter: { type: "creature" } }],
      effect: {
        kind: "may",
        prompt: "Return target creature to its owner's hand?",
        effect: { kind: "return-to-hand", target: 0 },
      },
      resolve: null,
      text: HIT,
    },
  ],
});
