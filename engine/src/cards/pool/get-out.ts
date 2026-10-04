import type { TargetSpec } from "../../target.js";
import { defineCard } from "../define.js";

// EDHREC rank 5891.
//
// Rulings:
//   [2024-09-20] Get Out's last mode can target any creatures and/or enchantments you own,
//     including ones controlled by other players.

const COUNTER_MODE = "Counter target creature or enchantment spell.";
const RETURN_MODE = "Return one or two target creatures and/or enchantments you own to your hand.";

// Owned by you, whoever controls it (the ruling).
const yours: TargetSpec = {
  kind: "permanent",
  whose: "any",
  filter: { typesAnyOf: ["creature", "enchantment"], ownedBy: "you" },
};

export default defineCard({
  name: "Get Out",
  manaCost: "{U}{U}",
  colors: ["U"],
  types: ["instant"],
  text: `Choose one —\n• ${COUNTER_MODE}\n• ${RETURN_MODE}`,
  castModal: {
    minModes: 1,
    maxModes: 1,
    modes: [
      {
        text: COUNTER_MODE,
        targets: [{ kind: "spell", filter: { typesAnyOf: ["creature", "enchantment"] } }],
        effect: { kind: "counter", target: 0 },
      },
      {
        text: RETURN_MODE,
        // One or two: a first, then up to one other (Archenemy's Charm's shape).
        targets: [yours, { kind: "optional", of: { kind: "other", of: yours, than: { slot: 0 } } }],
        effect: {
          kind: "sequence",
          simultaneous: true,
          effects: [
            { kind: "return-to-hand", target: 0 },
            { kind: "return-to-hand", target: 1 },
          ],
        },
      },
    ],
  },
});
