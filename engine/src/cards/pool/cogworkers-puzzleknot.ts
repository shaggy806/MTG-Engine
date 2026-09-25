import { defineCard } from "../define.js";

export default defineCard({
  name: "Cogworker's Puzzleknot",
  manaCost: "{2}",
  colors: [],
  types: ["artifact"],
  text: "When this artifact enters, create a 1/1 colorless Servo artifact creature token.\n{1}{W}, Sacrifice this artifact: Create a 1/1 colorless Servo artifact creature token.",
  activated: [
    {
      cost: { mana: "{1}{W}", tap: false, sacrifice: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Servo Token", count: 1 },
      resolve: null,
      text: "{1}{W}, Sacrifice this artifact: Create a 1/1 colorless Servo artifact creature token.",
    },
  ],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Servo Token", count: 1 },
      resolve: null,
      text: "When this artifact enters, create a 1/1 colorless Servo artifact creature token.",
    },
  ],
});
