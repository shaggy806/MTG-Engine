import { defineCard } from "../define.js";

const PUMP_TEXT = "{1}{R}: This creature gets +1/+0 until end of turn.";

// An omen card (rule 720): cast as the creature, or as Flush Out — which is
// shuffled into its owner's library as it resolves.
export default defineCard({
  name: "Stormshriek Feral",
  manaCost: "{4}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Dragon"],
  power: 3,
  toughness: 3,
  keywords: ["flying", "haste"],
  text: `Flying, haste\n${PUMP_TEXT}`,
  activated: [
    {
      cost: { mana: "{1}{R}", tap: false },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 1, toughness: 0, duration: "end-of-turn" },
      resolve: null,
      text: PUMP_TEXT,
    },
  ],
  faces: ["Stormshriek Feral", "Flush Out"],
  omen: true,
});
