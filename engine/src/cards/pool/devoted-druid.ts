import { defineCard } from "../define.js";
import { manaTapAbility } from "../helpers.js";

const UNTAP_TEXT = "Put a -1/-1 counter on this creature: Untap this creature.";

// The -1/-1 counter is the cost (`addCounter`), put on as it's activated:
// the one that takes it to 0 toughness kills it before the untap resolves,
// and before it could pay again (the ruling).
export default defineCard({
  name: "Devoted Druid",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Elf", "Druid"],
  power: 0,
  toughness: 2,
  text: `{T}: Add {G}.\n${UNTAP_TEXT}`,
  activated: [
    manaTapAbility("G"),
    {
      cost: { mana: null, tap: false, addCounter: { kind: "-1/-1", count: 1 } },
      targets: [],
      effect: { kind: "untap", target: "source" },
      resolve: null,
      text: UNTAP_TEXT,
    },
  ],
});
