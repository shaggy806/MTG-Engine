import { defineCard } from "../define.js";

const ENTER_TEXT =
  "When this creature enters, exile up to one target non-Salamander creature. That creature's controller creates a 4/3 blue Salamander Warrior creature token.";
const ENCORE_TEXT =
  "Encore {4}{U}{U} ({4}{U}{U}, Exile this card from your graveyard: For each opponent, create a token copy that attacks that opponent this turn if able. They gain haste. Sacrifice them at the beginning of the next end step. Activate only as a sorcery.)";

// With no target chosen, nobody gets a Salamander; the controller is read as
// the exiled creature last existed (rule 608.2h).
export default defineCard({
  name: "Amphin Mutineer",
  manaCost: "{3}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Salamander", "Pirate"],
  power: 3,
  toughness: 3,
  text: `${ENTER_TEXT}\n${ENCORE_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [
        { kind: "optional", of: { kind: "permanent", filter: { type: "creature", notSubtypes: ["Salamander"] } } },
      ],
      effect: {
        kind: "conditional",
        condition: { kind: "target-chosen", index: 0 },
        then: {
          kind: "sequence",
          effects: [
            { kind: "exile", target: 0 },
            { kind: "create-token", token: "Salamander Warrior Token", count: 1, who: "target-controller" },
          ],
        },
      },
      resolve: null,
      text: ENTER_TEXT,
    },
  ],
  activated: [
    {
      // Encore's cost exiles this card from the graveyard — `zone:
      // "graveyard"` makes that the implicit cost.
      cost: { mana: "{4}{U}{U}", tap: false },
      zone: "graveyard",
      sorcerySpeed: true,
      targets: [],
      effect: { kind: "encore" },
      resolve: null,
      text: "Encore {4}{U}{U} — Exile this card from your graveyard: For each opponent, create a token copy that attacks that opponent this turn if able.",
    },
  ],
});
