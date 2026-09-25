import { defineCard } from "../define.js";

export default defineCard({
  name: "Honored Knight-Captain",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Advisor", "Knight"],
  power: 1,
  toughness: 1,
  text: "When this creature enters, create a 1/1 white Human Soldier creature token.\n{4}{W}{W}, Sacrifice this creature: Search your library for an Equipment card, put it onto the battlefield, then shuffle.",
  activated: [
    {
      cost: { mana: "{4}{W}{W}", tap: false, sacrifice: "self" },
      targets: [],
      effect: {
        kind: "search-library",
        filter: { subtype: "Equipment" },
        destination: "battlefield",
        min: 0,
        max: 1,
      },
      resolve: null,
      text: "{4}{W}{W}, Sacrifice this creature: Search your library for an Equipment card, put it onto the battlefield, then shuffle.",
    },
  ],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Human Soldier Token", count: 1 },
      resolve: null,
      text: "When this creature enters, create a 1/1 white Human Soldier creature token.",
    },
  ],
});
