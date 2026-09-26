import { defineCard } from "../define.js";
import { equip } from "../helpers.js";

const DEATHTOUCH_TEXT =
  "Whenever equipped creature attacks or blocks, it and Zombies you control gain deathtouch until end of turn.";
const DAMAGE_TEXT =
  "Whenever equipped creature deals combat damage to a player, create that many 2/2 black Zombie creature tokens.";

export default defineCard({
  name: "Wand of Orcus",
  manaCost: "{2}{B}",
  colors: ["B"],
  supertypes: ["legendary"],
  types: ["artifact"],
  subtypes: ["Equipment"],
  text: `${DEATHTOUCH_TEXT}\n${DAMAGE_TEXT}\nEquip {3}`,
  triggered: [
    ...(["attacks", "blocks"] as const).map((on) => ({
      trigger: { on, who: "attached" as const },
      targets: [],
      effect: {
        kind: "sequence" as const,
        effects: [
          {
            kind: "grant-keyword" as const,
            target: "trigger-object" as const,
            keyword: "deathtouch" as const,
            duration: "end-of-turn" as const,
          },
          {
            kind: "grant-keyword-all" as const,
            filter: { subtype: "Zombie", controlledBy: "you" as const },
            keyword: "deathtouch" as const,
            duration: "end-of-turn" as const,
          },
        ],
      },
      resolve: null,
      text: DEATHTOUCH_TEXT,
    })),
    {
      trigger: { on: "deals-combat-damage-to-player", who: "attached" },
      targets: [],
      effect: { kind: "create-token", token: "Zombie Token", count: { triggerValue: true } },
      resolve: null,
      text: DAMAGE_TEXT,
    },
  ],
  activated: [equip("{3}")],
});
