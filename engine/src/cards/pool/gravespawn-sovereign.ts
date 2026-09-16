import { defineCard } from "../define.js";

export default defineCard({
  name: "Gravespawn Sovereign",
  manaCost: "{4}{B}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Zombie"],
  power: 3,
  toughness: 3,
  text: "Tap five untapped Zombies you control: Put target creature card from a graveyard onto the battlefield under your control.",
  activated: [
    {
      // The Sovereign is itself a Zombie and has no `{T}` of its own, so it
      // may be one of the five (`includeSelf`).
      cost: {
        mana: null,
        tap: false,
        tapOthers: { count: 5, filter: { subtype: "Zombie" }, includeSelf: true },
      },
      targets: [{ kind: "card-in-graveyard", filter: { type: "creature" } }],
      effect: { kind: "put-onto-battlefield", target: 0, underYourControl: true },
      resolve: null,
      text: "Tap five untapped Zombies you control: Put target creature card from a graveyard onto the battlefield under your control.",
    },
  ],
});
