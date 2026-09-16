import { defineCard } from "../define.js";

export default defineCard({
  name: "Rakshasa Debaser",
  manaCost: "{4}{B}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Demon"],
  power: 6,
  toughness: 6,
  text:
    "Whenever this creature attacks, put target creature card from defending player's graveyard onto the battlefield under your control.\n" +
    "Encore {6}{B}{B} ({6}{B}{B}, Exile this card from your graveyard: For each opponent, create a token copy that attacks that opponent this turn if able. They gain haste. Sacrifice them at the beginning of the next end step. Activate only as a sorcery.)",
  triggered: [
    {
      trigger: { on: "attacks", who: "self" },
      targets: [
        { kind: "card-in-graveyard", whose: "defending-player", filter: { type: "creature" } },
      ],
      effect: { kind: "put-onto-battlefield", target: 0, underYourControl: true },
      resolve: null,
      text: "Whenever this creature attacks, put target creature card from defending player's graveyard onto the battlefield under your control.",
    },
  ],
  activated: [
    {
      // Encore's cost exiles this card from the graveyard — `zone:
      // "graveyard"` makes that the implicit cost.
      cost: { mana: "{6}{B}{B}", tap: false },
      zone: "graveyard",
      sorcerySpeed: true,
      targets: [],
      effect: { kind: "encore" },
      resolve: null,
      text: "Encore {6}{B}{B} — Exile this card from your graveyard: For each opponent, create a token copy that attacks that opponent this turn if able.",
    },
  ],
});
