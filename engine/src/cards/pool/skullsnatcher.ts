import { defineCard } from "../define.js";
import { ninjutsu, ninjutsuText } from "../helpers.js";

// EDHREC rank 6350.
const HIT = "Whenever this creature deals combat damage to a player, exile up to two target cards from that player's graveyard.";

export default defineCard({
  name: "Skullsnatcher",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Rat", "Ninja"],
  power: 2,
  toughness: 1,
  text: `${ninjutsuText("{B}")}\n${HIT}`,
  activated: [ninjutsu("{B}")],
  triggered: [
    {
      trigger: { on: "deals-combat-damage-to-player", who: "self" },
      targets: [{ kind: "any-number", of: { kind: "card-in-graveyard", whose: "trigger-player" }, max: 2 }],
      effect: { kind: "for-each-target", from: 0, effect: { kind: "exile", target: 0 }, simultaneous: true },
      resolve: null,
      text: HIT,
    },
  ],
});
