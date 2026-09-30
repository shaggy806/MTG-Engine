import { defineCard } from "../define.js";

const DIES_TEXT =
  "When this creature dies, create a 2/2 red Dragon creature token with flying and \"{R}: This creature gets +1/+0 until end of turn.\"";

/** 0/2 red Dragon Egg with defender — Nesting Dragon's token. "Dragon Egg" is
 * two creature types, so it's a Dragon. */
export default defineCard({
  name: "Dragon Egg Token",
  art: "435577cb-a8b6-4795-a301-92128a68d070",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Dragon", "Egg"],
  power: 0,
  toughness: 2,
  keywords: ["defender"],
  text: `Defender\n${DIES_TEXT}`,
  triggered: [
    {
      trigger: { on: "dies", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Dragon Token (Firebreathing)", count: 1 },
      resolve: null,
      text: DIES_TEXT,
    },
  ],
});
