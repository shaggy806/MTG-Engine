import { defineCard } from "../define.js";

// EDHREC rank 3071.
//
// The target is chosen before the sacrifice is paid (rule 602.2b → 601.2c,
// 601.2h), so "another" keeps the Savior itself out.
const TEXT = "Sacrifice this creature: Another target creature you control gains indestructible until end of turn.";

export default defineCard({
  name: "Selfless Savior",
  manaCost: "{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Dog"],
  power: 1,
  toughness: 1,
  text: `${TEXT} (Damage and effects that say "destroy" don't destroy it.)`,
  activated: [
    {
      cost: { mana: null, tap: false, sacrifice: "self" },
      targets: [{ kind: "other", of: "creature-you-control" }],
      effect: { kind: "grant-keyword", target: 0, keyword: "indestructible", duration: "end-of-turn" },
      resolve: null,
      text: TEXT,
    },
  ],
});
