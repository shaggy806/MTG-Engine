import { defineCard } from "../define.js";

// EDHREC rank 6052.
// Makes Insect → use "Insect Token (Infestation Sage)".

export default defineCard({
  name: "The Swarmweaver",
  manaCost: "{2}{B}{G}",
  colors: ["B", "G"],
  supertypes: ["legendary"],
  types: ["artifact", "creature"],
  subtypes: ["Scarecrow"],
  power: 2,
  toughness: 3,
  text: "When The Swarmweaver enters, create two 1/1 black and green Insect creature tokens with flying.\nDelirium — As long as there are four or more card types among cards in your graveyard, Insects and Spiders you control get +1/+1 and have deathtouch.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Insect Token (Infestation Sage)", count: 2 },
      resolve: null,
      text: "When The Swarmweaver enters, create two 1/1 black and green Insect creature tokens with flying.",
    },
  ],
  static: [
    {
      // "Insects and Spiders you control" — permanents of either type.
      affects: { scope: "filter", filter: { subtypes: ["Insect", "Spider"], controlledBy: "you" } },
      condition: { kind: "delirium" },
      grantPt: [1, 1],
      grantKeywords: ["deathtouch"],
      text:
        "Delirium — As long as there are four or more card types among cards in your graveyard, " +
        "Insects and Spiders you control get +1/+1 and have deathtouch.",
    },
  ],
});
