import { defineCard } from "../define.js";

export default defineCard({
  name: "Lazotep Plating",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["instant"],
  text: "Amass Zombies 1.\nYou and permanents you control gain hexproof until end of turn.",
  effect: {
    kind: "sequence",
    effects: [
      { kind: "amass", amount: 1, creatureType: "Zombie" },
      // "You *and* permanents you control" — the player half needs its own
      // effect; the keyword only ever lives on a permanent.
      { kind: "grant-player-hexproof", who: "you" },
      {
        kind: "grant-keyword-all",
        filter: { controlledBy: "you" },
        keyword: "hexproof",
        duration: "end-of-turn",
      },
    ],
  },
});
