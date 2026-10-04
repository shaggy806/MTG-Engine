import { defineCard } from "../define.js";

// EDHREC rank 6337.

export default defineCard({
  name: "Dragonologist",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Human", "Wizard"],
  power: 1,
  toughness: 3,
  text: "When this creature enters, look at the top six cards of your library. You may reveal an instant, sorcery, or Dragon card from among them and put it into your hand. Put the rest on the bottom of your library in a random order.\nUntapped Dragons you control have hexproof.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "look-and-choose",
        zone: "library",
        count: 6,
        reveal: "chosen",
        min: 0,
        max: 1,
        filter: { anyOf: [{ typesAnyOf: ["instant", "sorcery"] }, { subtype: "Dragon" }] },
        destination: "hand",
        leftover: "bottom-random",
      },
      resolve: null,
      text: "When this creature enters, look at the top six cards of your library. You may reveal an instant, sorcery, or Dragon card from among them and put it into your hand. Put the rest on the bottom of your library in a random order.",
    },
  ],
  static: [
    {
      affects: { scope: "filter", filter: { subtype: "Dragon", controlledBy: "you", tapped: false } },
      grantKeywords: ["hexproof"],
      text: "Untapped Dragons you control have hexproof.",
    },
  ],
});
