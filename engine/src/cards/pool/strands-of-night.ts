import { defineCard } from "../define.js";

export default defineCard({
  name: "Strands of Night",
  manaCost: "{2}{B}{B}",
  colors: ["B"],
  types: ["enchantment"],
  text: "{B}{B}, Pay 2 life, Sacrifice a Swamp: Return target creature card from your graveyard to the battlefield.",
  activated: [
    {
      cost: { mana: "{B}{B}", tap: false, payLife: 2, sacrifice: { filter: { subtype: "Swamp" } } },
      targets: [{ kind: "card-in-graveyard", whose: "you", filter: { type: "creature" } }],
      effect: { kind: "put-onto-battlefield", target: 0 },
      resolve: null,
      text: "{B}{B}, Pay 2 life, Sacrifice a Swamp: Return target creature card from your graveyard to the battlefield.",
    },
  ],
});
