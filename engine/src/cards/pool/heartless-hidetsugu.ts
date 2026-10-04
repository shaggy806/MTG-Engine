import { defineCard } from "../define.js";

// EDHREC rank 3068.
//
// One damage event to every player (`dealDamageScoped` batches it), each
// amount read from that player's own life just before their damage — nothing
// else changes it first, since lifelink's gain waits for the batch to end. A
// negative life total halves to a negative amount, clamped to 0.
const TEXT =
  "{T}: Heartless Hidetsugu deals damage to each player equal to half that player's life total, rounded down.";

export default defineCard({
  name: "Heartless Hidetsugu",
  manaCost: "{3}{R}{R}",
  colors: ["R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Ogre", "Shaman"],
  power: 4,
  toughness: 3,
  text: TEXT,
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: {
        kind: "damage",
        who: "each-player",
        amount: { half: { lifeTotal: "each" }, round: "down" },
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
