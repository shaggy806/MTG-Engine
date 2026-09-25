import { defineCard } from "../define.js";

export default defineCard({
  name: "Draugr Recruiter",
  manaCost: "{3}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Zombie", "Cleric"],
  power: 3,
  toughness: 3,
  text: "Boast — {3}{B}: Return target creature card from your graveyard to your hand. (Activate only if this creature attacked this turn and only once each turn.)",
  activated: [
    {
      cost: { mana: "{3}{B}", tap: false },
      targets: [{ kind: "card-in-graveyard", whose: "you", filter: { type: "creature" } }],
      effect: { kind: "return-to-hand", target: 0, from: "graveyard" },
      resolve: null,
      text: "Boast — {3}{B}: Return target creature card from your graveyard to your hand.",
      boast: true,
    },
  ],
});
