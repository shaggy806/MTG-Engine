import { defineCard } from "../define.js";

const TEXT =
  "Landfall — Whenever a land you control enters, create a 0/2 red Dragon Egg creature token with defender and \"When this token dies, create a 2/2 red Dragon creature token with flying and '{R}: This token gets +1/+0 until end of turn.'\"";

export default defineCard({
  name: "Nesting Dragon",
  manaCost: "{3}{R}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Dragon"],
  power: 5,
  toughness: 4,
  keywords: ["flying"],
  text: `Flying\n${TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "land" } },
      targets: [],
      effect: { kind: "create-token", token: "Dragon Egg Token", count: 1 },
      resolve: null,
      text: TEXT,
    },
  ],
});
