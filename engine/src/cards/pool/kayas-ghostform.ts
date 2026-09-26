import { defineCard } from "../define.js";

const TEXT = "When enchanted permanent dies or is put into exile, return that card to the battlefield under your control.";

// Leaving alongside the permanent still returns it (rule 603.10a); a card
// that has left its graveyard or exile by then stays where it went, and a
// token doesn't come back at all (rule 400.7 — the rulings).
export default defineCard({
  name: "Kaya's Ghostform",
  manaCost: "{B}",
  colors: ["B"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  text: `Enchant creature or planeswalker you control\n${TEXT}`,
  targets: [{ kind: "permanent", whose: "you", filter: { typesAnyOf: ["creature", "planeswalker"] } }],
  triggered: [
    {
      trigger: { on: "leaves-battlefield", who: "attached", to: ["graveyard", "exile"] },
      targets: [],
      effect: { kind: "put-onto-battlefield", target: "trigger-object", underYourControl: true },
      resolve: null,
      text: TEXT,
    },
  ],
});
