import { defineCard } from "../define.js";

export default defineCard({
  name: "Hapatra, Vizier of Poisons",
  manaCost: "{B}{G}",
  colors: ["B", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Cleric"],
  power: 2,
  toughness: 2,
  text:
    "Whenever Hapatra deals combat damage to a player, you may put a -1/-1 counter on target creature.\n" +
    "Whenever you put one or more -1/-1 counters on a creature, create a 1/1 green Snake " +
    "creature token with deathtouch.",
  triggered: [
    {
      trigger: { on: "deals-combat-damage-to-player", who: "self" },
      targets: ["creature"],
      effect: {
        kind: "may",
        prompt: "Put a -1/-1 counter on the target creature?",
        effect: { kind: "add-counter", target: 0, counter: "-1/-1", amount: 1 },
      },
      resolve: null,
      text: "Whenever Hapatra deals combat damage to a player, you may put a -1/-1 counter on target creature.",
    },
    {
      // Any creature, whoever controls it, as long as you put the counters
      // there — once per creature (2017-04-18 ruling), Hapatra included.
      trigger: { on: "counters-put", who: "any", counter: "-1/-1", filter: { type: "creature" }, byYou: true },
      targets: [],
      effect: { kind: "create-token", token: "Deathtouch Snake Token", count: 1 },
      resolve: null,
      text:
        "Whenever you put one or more -1/-1 counters on a creature, create a 1/1 green Snake " +
        "creature token with deathtouch.",
    },
  ],
});
