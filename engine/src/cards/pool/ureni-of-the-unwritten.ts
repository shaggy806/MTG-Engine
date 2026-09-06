import { defineCard } from "../define.js";

export default defineCard({
  name: "Ureni of the Unwritten",
  manaCost: "{4}{G}{G}",
  colors: ["G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Elf", "Shaman"],
  power: 5,
  toughness: 5,
  text:
    "When Ureni of the Unwritten enters the battlefield, look at the top 8 cards of your library. You may put a Dragon card from among them onto the battlefield. Put the rest on the bottom of your library in a random order.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "look-and-choose",
        zone: "library",
        count: 8,
        min: 0,
        max: 1,
        destination: "battlefield",
        leftover: "bottom-random",
        filter: { subtype: "Dragon" },
      },
      resolve: null,
      text:
        "When Ureni of the Unwritten enters the battlefield, look at the top 8 cards of your library. You may put a Dragon card from among them onto the battlefield. Put the rest on the bottom of your library in a random order.",
    },
  ],
});
