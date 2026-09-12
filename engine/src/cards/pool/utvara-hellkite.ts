import { defineCard } from "../define.js";

export default defineCard({
  name: "Utvara Hellkite",
  manaCost: "{6}{R}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Dragon"],
  power: 6,
  toughness: 6,
  keywords: ["flying"],
  text: "Flying\nWhenever a Dragon you control attacks, create a 6/6 red Dragon creature token with flying.",
  triggered: [
    {
      // needed-cards P11 — the "attacks" TriggerSpec's new `filter` narrows
      // this to a Dragon (Utvara Hellkite itself counts, since it's a Dragon).
      trigger: { on: "attacks", who: "you-control", filter: { subtype: "Dragon" } },
      targets: [],
      effect: { kind: "create-token", token: "6/6 Dragon Token", count: 1 },
      resolve: null,
      text: "Whenever a Dragon you control attacks, create a 6/6 red Dragon creature token with flying.",
    },
  ],
});
