import { defineCard } from "../define.js";

export default defineCard({
  name: "Medusa, Inhuman Queen",
  manaCost: "{2}{G}",
  colors: ["G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Inhuman", "Noble", "Hero"],
  power: 2,
  toughness: 2,
  keywords: ["reach", "vigilance"],
  text: "Reach, vigilance\nWhenever a player casts a noncreature spell, put a +1/+1 counter on Medusa.",
  triggered: [
    {
      trigger: { on: "cast-spell", who: "any", noncreatureOnly: true },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
      resolve: null,
      text: "Whenever a player casts a noncreature spell, put a +1/+1 counter on Medusa.",
    },
  ],
});
