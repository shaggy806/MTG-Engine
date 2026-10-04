import { defineCard } from "../define.js";

// EDHREC rank 4082.

export default defineCard({
  name: "Bloodline Necromancer",
  manaCost: "{4}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Vampire", "Wizard"],
  power: 3,
  toughness: 2,
  keywords: ["lifelink"],
  text: "Lifelink\nWhen this creature enters, you may return target Vampire or Wizard creature card from your graveyard to the battlefield.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [
        {
          kind: "card-in-graveyard",
          whose: "you",
          filter: { type: "creature", anyOf: [{ subtype: "Vampire" }, { subtype: "Wizard" }] },
        },
      ],
      effect: {
        kind: "may",
        prompt: "Return target Vampire or Wizard creature card from your graveyard to the battlefield?",
        effect: { kind: "put-onto-battlefield", target: 0 },
      },
      resolve: null,
      text: "When this creature enters, you may return target Vampire or Wizard creature card from your graveyard to the battlefield.",
    },
  ],
});
