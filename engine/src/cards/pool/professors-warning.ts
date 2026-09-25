import { defineCard } from "../define.js";

export default defineCard({
  name: "Professor's Warning",
  manaCost: "{B}",
  colors: ["B"],
  types: ["instant"],
  text: "Choose one —\n• Put a +1/+1 counter on target creature.\n• Target creature gains indestructible until end of turn. (Damage and effects that say \"destroy\" don't destroy it.)",
  castModal: {
    minModes: 1,
    maxModes: 1,
    modes: [
      {
        text: "Put a +1/+1 counter on target creature.",
        targets: ["creature"],
        effect: { kind: "add-counter", target: 0, counter: "+1/+1", amount: 1 },
      },
      {
        text: "Target creature gains indestructible until end of turn.",
        targets: ["creature"],
        effect: {
          kind: "grant-keyword",
          target: 0,
          keyword: "indestructible",
          duration: "end-of-turn",
        },
      },
    ],
  },
});
