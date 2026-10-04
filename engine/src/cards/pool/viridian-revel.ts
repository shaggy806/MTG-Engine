import { defineCard } from "../define.js";

// EDHREC rank 4060.
//
// Rulings:
//   [2011-01-01] It doesn’t matter who controlled the artifact while it was on the battlefield,
//     only whose graveyard it was put into.

export default defineCard({
  name: "Viridian Revel",
  manaCost: "{1}{G}{G}",
  colors: ["G"],
  types: ["enchantment"],
  text: "Whenever an artifact is put into an opponent's graveyard from the battlefield, you may draw a card.",
  triggered: [
    {
      // "Put into a graveyard from the battlefield" is "dies" for any permanent
      // (rule 700.4 — Disciple of the Vault's shape). Whose graveyard is the
      // owner's, whoever controlled it (the ruling): `ownedBy`.
      trigger: { on: "dies", who: "any", filter: { type: "artifact", ownedBy: "opponent" } },
      targets: [],
      effect: { kind: "may", prompt: "Draw a card?", effect: { kind: "draw", amount: 1 } },
      resolve: null,
      text: "Whenever an artifact is put into an opponent's graveyard from the battlefield, you may draw a card.",
    },
  ],
});
