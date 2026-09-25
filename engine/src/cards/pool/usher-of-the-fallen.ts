import { defineCard } from "../define.js";

export default defineCard({
  name: "Usher of the Fallen",
  manaCost: "{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Spirit", "Warrior"],
  power: 2,
  toughness: 1,
  text: "Boast — {1}{W}: Create a 1/1 white Human Warrior creature token. (Activate only if this creature attacked this turn and only once each turn.)",
  activated: [
    {
      cost: { mana: "{1}{W}", tap: false },
      targets: [],
      effect: { kind: "create-token", token: "Human Warrior Token", count: 1 },
      resolve: null,
      text: "Boast — {1}{W}: Create a 1/1 white Human Warrior creature token.",
      boast: true,
    },
  ],
});
