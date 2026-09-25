import { defineCard } from "../define.js";

export default defineCard({
  name: "Yavimaya Sapherd",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Fungus"],
  power: 2,
  toughness: 2,
  text: "When this creature enters, create a 1/1 green Saproling creature token.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Saproling Token", count: 1 },
      resolve: null,
      text: "When this creature enters, create a 1/1 green Saproling creature token.",
    },
  ],
});
