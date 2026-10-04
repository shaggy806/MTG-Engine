import { defineCard } from "../define.js";

// EDHREC rank 6080.

const TEXT =
  "At the beginning of combat on your turn, put a +1/+1 counter on target creature you control. It gains lifelink until end of turn.";

export default defineCard({
  name: "Rosa, Resolute White Mage",
  manaCost: "{3}{W}",
  colors: ["W"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Noble", "Cleric"],
  power: 2,
  toughness: 3,
  keywords: ["reach"],
  text: `Reach (This creature can block creatures with flying.)\n${TEXT} (Damage dealt by the creature also causes you to gain that much life.)`,
  triggered: [
    {
      trigger: { on: "step-begins", step: "begin-combat", who: "you" },
      targets: ["creature-you-control"],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "add-counter", target: 0, counter: "+1/+1", amount: 1 },
          { kind: "grant-keyword", target: 0, keyword: "lifelink", duration: "end-of-turn" },
        ],
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
