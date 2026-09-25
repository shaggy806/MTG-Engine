import { defineCard } from "../define.js";

export default defineCard({
  name: "Ghen, Arcanum Weaver",
  manaCost: "{R}{W}{B}",
  colors: ["W", "B", "R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Wizard"],
  power: 2,
  toughness: 3,
  text: "{R}{W}{B}, {T}, Sacrifice an enchantment: Return target enchantment card from your graveyard to the battlefield.",
  activated: [
    {
      cost: { mana: "{R}{W}{B}", tap: true, sacrifice: { filter: { type: "enchantment" } } },
      targets: [{ kind: "card-in-graveyard", whose: "you", filter: { type: "enchantment" } }],
      effect: { kind: "put-onto-battlefield", target: 0 },
      resolve: null,
      text: "{R}{W}{B}, {T}, Sacrifice an enchantment: Return target enchantment card from your graveyard to the battlefield.",
    },
  ],
});
