import { defineCard } from "../define.js";

// Top-commanders rank 107. The permission rides on the chosen card, not on
// Silas: it outlasts Silas leaving, lapses at end of turn, and ends if the
// card leaves the graveyard (a card that comes back is a new object).
export default defineCard({
  name: "Silas Renn, Seeker Adept",
  manaCost: "{1}{U}{B}",
  colors: ["U", "B"],
  supertypes: ["legendary"],
  types: ["artifact", "creature"],
  subtypes: ["Human"],
  power: 2,
  toughness: 2,
  pairing: { kind: "partner" },
  keywords: ["deathtouch"],
  text:
    "Deathtouch\n" +
    "Whenever Silas Renn deals combat damage to a player, choose target artifact card in your " +
    "graveyard. You may cast that card this turn.\n" +
    "Partner (You can have two commanders if both have partner.)",
  triggered: [
    {
      trigger: { on: "deals-combat-damage-to-player", who: "self" },
      targets: [{ kind: "card-in-graveyard", whose: "you", filter: { type: "artifact" } }],
      effect: { kind: "grant-graveyard-cast", target: 0 },
      resolve: null,
      text:
        "Whenever Silas Renn deals combat damage to a player, choose target artifact card in " +
        "your graveyard. You may cast that card this turn.",
    },
  ],
});
