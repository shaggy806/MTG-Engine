import { defineCard } from "../define.js";


export default defineCard({
  name: "Weftstalker Ardent",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Drix", "Artificer"],
  power: 2,
  toughness: 3,
  text: "Whenever another creature or artifact you control enters, this creature deals 1 damage to each opponent.\nWarp {R} (You may cast this card from your hand for its warp cost. Exile this creature at the beginning of the next end step, then you may cast it from exile on a later turn.)",
  triggered: [
    {
      trigger: {
        on: "enters-battlefield",
        who: "you-control",
        filter: { typesAnyOf: ["creature", "artifact"] },
        otherOnly: true,
      },
      targets: [],
      effect: { kind: "damage", amount: 1, who: "each-opponent" },
      resolve: null,
      text: "Whenever another creature or artifact you control enters, this creature deals 1 damage to each opponent.",
    },
  ],
  warp: { cost: "{R}" },
});
