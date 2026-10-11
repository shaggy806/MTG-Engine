import { defineCard } from "../define.js";

// EDHREC rank 6698. An adventurer card (Hypnotic Sprite // Mesmeric Glare's
// shape); its Adventure is Steam Clean (steam-clean.ts).
//
// The trigger is Cindervines' "that player" (the caster, `trigger-controller`)
// with Brinelin's mana-value filter on the spell cast — read off the spell on
// the stack, so an {X} spell counts its X (rule 202.3e).
const TEXT =
  "Whenever an opponent casts a spell with mana value 3 or less, this creature deals 1 damage to that player.";

export default defineCard({
  name: "Scalding Viper",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Elemental", "Snake"],
  power: 2,
  toughness: 1,
  text: TEXT,
  triggered: [
    {
      trigger: { on: "cast-spell", who: "opponent", filter: { manaValue: { op: "lte", n: 3 } } },
      targets: [],
      effect: { kind: "damage", amount: 1, who: "trigger-controller" },
      resolve: null,
      text: TEXT,
    },
  ],
  faces: ["Scalding Viper", "Steam Clean"],
  adventure: true,
});
