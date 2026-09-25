import { defineCard } from "../define.js";

export default defineCard({
  name: "Gravewaker",
  manaCost: "{4}{B}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Bird", "Spirit"],
  power: 5,
  toughness: 5,
  keywords: ["flying"],
  text: "Flying (This creature can't be blocked except by creatures with flying or reach.)\n{5}{B}{B}: Return target creature card from your graveyard to the battlefield tapped.",
  activated: [
    {
      cost: { mana: "{5}{B}{B}", tap: false },
      targets: [{ kind: "card-in-graveyard", whose: "you", filter: { type: "creature" } }],
      effect: { kind: "put-onto-battlefield", target: 0, enterTapped: true },
      resolve: null,
      text: "{5}{B}{B}: Return target creature card from your graveyard to the battlefield tapped.",
    },
  ],
});
