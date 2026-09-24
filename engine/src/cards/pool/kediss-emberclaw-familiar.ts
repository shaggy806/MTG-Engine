import { defineCard } from "../define.js";

// Top-commanders rank 255. A `deals-damage` trigger on combat damage from a
// commander you control to an opponent; "it" is that commander, so the
// damage is its own (lifelink, deathtouch, protection read off it) and
// "each other opponent" is every opponent of yours but the one it hit. One
// trigger per combat damage event, so a double striker triggers twice.
// Noncombat, so it can't retrigger itself. Partner is declared by `pairing`.
const KEDISS_TEXT =
  "Whenever a commander you control deals combat damage to an opponent, it deals that much " +
  "damage to each other opponent.";

export default defineCard({
  name: "Kediss, Emberclaw Familiar",
  manaCost: "{1}{R}",
  colors: ["R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Elemental", "Lizard"],
  power: 1,
  toughness: 1,
  pairing: { kind: "partner" },
  text: `${KEDISS_TEXT}\nPartner (You can have two commanders if both have partner.)`,
  triggered: [
    {
      trigger: {
        on: "deals-damage",
        who: "you-control",
        filter: { isCommander: true },
        to: "opponent",
        combat: true,
      },
      targets: [],
      effect: {
        kind: "damage",
        amount: { triggerValue: true },
        who: "each-other-opponent",
        from: "trigger-object",
      },
      resolve: null,
      text: KEDISS_TEXT,
    },
  ],
});
