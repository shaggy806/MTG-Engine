import { defineCard } from "../define.js";
import { ninjutsu, ninjutsuText } from "../helpers.js";

// EDHREC rank 4263.
const HIT = "Whenever this creature deals combat damage to a player, destroy target nonblack creature that player controls.";

export default defineCard({
  name: "Throat Slitter",
  manaCost: "{4}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Rat", "Ninja"],
  power: 2,
  toughness: 2,
  text: `${ninjutsuText("{2}{B}")}\n${HIT}`,
  activated: [ninjutsu("{2}{B}")],
  triggered: [
    {
      trigger: { on: "deals-combat-damage-to-player", who: "self" },
      targets: [{ kind: "permanent", whose: "trigger-player", filter: { type: "creature", notColors: ["B"] } }],
      effect: { kind: "destroy", target: 0 },
      resolve: null,
      text: HIT,
    },
  ],
});
