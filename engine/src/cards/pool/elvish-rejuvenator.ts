import { defineCard } from "../define.js";

// EDHREC rank 5368.

export default defineCard({
  name: "Elvish Rejuvenator",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Elf", "Druid"],
  power: 1,
  toughness: 1,
  text: "When this creature enters, look at the top five cards of your library. You may put a land card from among them onto the battlefield tapped. Put the rest on the bottom of your library in a random order.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "look-and-choose",
        zone: "library",
        count: 5,
        min: 0,
        max: 1,
        filter: { type: "land" },
        destination: "battlefield",
        enterTapped: true,
        leftover: "bottom-random",
      },
      resolve: null,
      text: "When this creature enters, look at the top five cards of your library. You may put a land card from among them onto the battlefield tapped. Put the rest on the bottom of your library in a random order.",
    },
  ],
});
