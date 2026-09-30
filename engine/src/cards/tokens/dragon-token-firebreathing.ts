import { defineCard } from "../define.js";

/** 2/2 red flying Dragon with "{R}: +1/+0" — what a Dragon Egg hatches into. */
export default defineCard({
  name: "Dragon Token (Firebreathing)",
  art: "1e2aaaca-6563-406f-b1bc-6849ba555da8",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Dragon"],
  power: 2,
  toughness: 2,
  keywords: ["flying"],
  text: "Flying\n{R}: This creature gets +1/+0 until end of turn.",
  activated: [
    {
      cost: { mana: "{R}", tap: false },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 1, toughness: 0, duration: "end-of-turn" },
      resolve: null,
      text: "{R}: This creature gets +1/+0 until end of turn.",
    },
  ],
});
