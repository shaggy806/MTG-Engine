import { defineCard } from "../define.js";

// EDHREC rank 5402.
//
// Rulings:
//   [2023-11-10] Opponents who have left the game aren't counted when determining how many tokens
//     to create.
//   [2023-11-10] The tokens copy only what's on the original card. Effects that modified that
//     creature when it was previously on the battlefield won't be copied.
//   [2023-11-10] Each token must attack the appropriate player if able.
//   [2023-11-10] Exiling the card with encore is a cost to activate the ability.
// Encore is Impulsive Pilferer's shape: a graveyard ability whose cost exiles
// the card, then the `encore` effect.

const LORD_TEXT = "Other Merfolk you control get +1/+0 and have flying.";

export default defineCard({
  name: "Mist Dancer",
  manaCost: "{4}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Merfolk", "Wizard"],
  power: 3,
  toughness: 3,
  keywords: ["flying"],
  text: `Flying\n${LORD_TEXT}\nEncore {5}{U}{U} ({5}{U}{U}, Exile this card from your graveyard: For each opponent, create a token copy that attacks that opponent this turn if able. They gain haste. Sacrifice them at the beginning of the next end step. Activate only as a sorcery.)`,
  static: [
    {
      affects: { scope: "creatures-you-control", excludeSelf: true, subtype: "Merfolk" },
      grantPt: [1, 0],
      grantKeywords: ["flying"],
      text: LORD_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: "{5}{U}{U}", tap: false },
      zone: "graveyard",
      sorcerySpeed: true,
      targets: [],
      effect: { kind: "encore" },
      resolve: null,
      text: "Encore {5}{U}{U} — Exile this card from your graveyard: For each opponent, create a token copy that attacks that opponent this turn if able.",
    },
  ],
});
