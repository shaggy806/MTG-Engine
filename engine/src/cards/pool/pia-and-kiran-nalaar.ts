import { defineCard } from "../define.js";

export default defineCard({
  name: "Pia and Kiran Nalaar",
  manaCost: "{2}{R}{R}",
  colors: ["R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Artificer"],
  power: 2,
  toughness: 2,
  text: "When Pia and Kiran Nalaar enters, create two 1/1 colorless Thopter artifact creature tokens with flying.\n{2}{R}, Sacrifice an artifact: Pia and Kiran Nalaar deals 2 damage to any target.",
  activated: [
    {
      cost: { mana: "{2}{R}", tap: false, sacrifice: { filter: { type: "artifact" } } },
      targets: ["any-target"],
      effect: { kind: "damage", amount: 2, target: 0 },
      resolve: null,
      text: "{2}{R}, Sacrifice an artifact: Pia and Kiran Nalaar deals 2 damage to any target.",
    },
  ],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Thopter Token", count: 2 },
      resolve: null,
      text: "When Pia and Kiran Nalaar enters, create two 1/1 colorless Thopter artifact creature tokens with flying.",
    },
  ],
});
