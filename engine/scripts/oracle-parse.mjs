// Turns a card face's Oracle text into card-definition data, as far as plain
// pattern matching safely can. Used by `card-scaffold.mjs`.
//
// Two tiers:
//   1. Structure — every activated ability's cost and restrictions, every
//      loyalty ability's cost, every triggered ability's trigger, the targets
//      its effect names, keyword lines, partner abilities, ward, equip, enchant,
//      cycling and flashback lines, and a handful of static lines.
//   2. Effects — whole sentences matched against a fixed set of templates
//      ("Draw a card.", "~ deals 3 damage to any target.", "Add {G} or {U}.").
//      A template matches the whole sentence or not at all, so nothing is ever
//      half-read: a sentence no template covers stays a TODO for a person.
//
// Everything returned is plain data in the engine's own shapes, so a test can
// hand it to `defineCard` and play it. An ability whose effect didn't fully
// parse keeps `effect: null` and carries `__todo` (the sentences left to
// author) and `__hint` (what the sentences that *did* parse became) — the
// serializer below prints both as comments.
//
// Pure: no I/O. `parseFace(face, ctx)`, where `ctx.tokenFor(description)`
// names the engine token a "create …" clause means (or `null`).

// ------------------------------------------------------------------ text

const NUMBERS = {
  a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
};
const N = "(a|an|one|two|three|four|five|six|seven|eight|nine|ten|x|\\d+)";
const numberOf = (word) => {
  const w = word.toLowerCase();
  if (w === "x") return "x";
  if (/^\d+$/.test(w)) return Number(w);
  return NUMBERS[w];
};

export const stripReminder = (line) => line.replace(/\s*\([^)]*\)/g, "").trim();

/** The line as the templates read it: reminder text gone, the card's own name
 * (and its short name, "Kibo" for "Kibo, Uktabi Prince") and "this creature" /
 * "this artifact" / … all written "~". */
export function normalize(line, faceName) {
  let s = stripReminder(line);
  s = s.split(faceName).join("~");
  const short = faceName.split(",")[0];
  if (short !== faceName && short.length >= 3) s = s.replace(new RegExp(`\\b${escapeRe(short)}\\b`, "g"), "~");
  s = s.replace(/\bthis (creature|artifact|enchantment|land|permanent|Equipment|Vehicle|Aura|token|spell|card|Saga)\b/gi, "~");
  return s.trim();
}
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Dash labels that aren't ability or flavor words (rule 207.2c-d): each one
 * changes how its line works, and the parser models none of them. Power-up is
 * once only and cheaper the turn it entered, Max speed and a Case's Solved
 * grant their line conditionally, Forecast works only from your hand in your
 * upkeep, and the others are Sagas, Attractions and companions. (Exhaust and
 * Boast are read, as activated-ability flags.) */
const MEANINGFUL_LABEL = /^(Power-up|Max speed|Forecast|Solved|To solve|Companion|Visit|[IVX]+(?:, [IVX]+)*) — /;

/** "Add {G}. Draw a card." → its sentences, each ending in its period. A
 * quoted ability ("…with \"Whenever …, draw a card.\"") is part of the
 * sentence around it, never a sentence of its own. */
function sentencesOf(text) {
  const out = [];
  let current = "";
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    current += ch;
    if (ch === '"' || ch === "“" || ch === "”") quoted = !quoted;
    const next = text.slice(i + 1);
    if (!quoted && (ch === "." || (ch === '"' && current.endsWith('."'))) && /^\s+[A-Z~•]/.test(next)) {
      out.push(current.trim());
      current = "";
    }
  }
  if (current.trim() !== "") out.push(current.trim());
  return out;
}

// -------------------------------------------------------------- keywords

export const KEYWORDS = {
  flying: "flying", reach: "reach", haste: "haste", vigilance: "vigilance", defender: "defender",
  "first strike": "first-strike", "double strike": "double-strike", trample: "trample",
  deathtouch: "deathtouch", lifelink: "lifelink", menace: "menace", indestructible: "indestructible",
  hexproof: "hexproof", shroud: "shroud", flash: "flash", fear: "fear", intimidate: "intimidate",
  plainswalk: "plainswalk", islandwalk: "islandwalk", swampwalk: "swampwalk",
  mountainwalk: "mountainwalk", forestwalk: "forestwalk", desertwalk: "desertwalk",
};
const KW = `(${Object.keys(KEYWORDS).join("|")})`;

// ------------------------------------------------------------ type words

const CARD_TYPES = ["creature", "artifact", "enchantment", "land", "planeswalker", "instant", "sorcery", "battle"];
/** Creature types whose plural isn't just "-s". */
const IRREGULAR = { Elves: "Elf", Dwarves: "Dwarf", Wolves: "Wolf", Werewolves: "Werewolf", Faeries: "Faerie", Mice: "Mouse", Fungi: "Fungus", Allies: "Ally", Sphinxes: "Sphinx", Foxes: "Fox", Octopi: "Octopus", Djinn: "Djinn", Mercenaries: "Mercenary", Zombies: "Zombie" };
/** Subtypes that end in "s" in the singular: the land type Plains and the
 * creature types that do (the engine's CREATURE_TYPES), which the plural
 * rule below would otherwise clip ("Plains" → "Plain"). */
const SINGULAR_WITH_S = new Set([
  "Plains", "Astartes", "Aurochs", "Custodes", "Cyclops", "Fungus", "Homunculus", "Nautilus", "Octopus",
  "Pegasus", "Platypus", "Thalakos", "Walrus",
]);
const singular = (w) => {
  const lower = w.toLowerCase();
  if (CARD_TYPES.includes(lower.replace(/s$/, ""))) return lower.replace(/s$/, "");
  if (SINGULAR_WITH_S.has(w)) return w;
  if (IRREGULAR[w] !== undefined) return IRREGULAR[w];
  // A capitalised plural subtype: "Goblins", "Slivers".
  if (/^[A-Z][a-z]+s$/.test(w) && !/ss$/.test(w)) return w.slice(0, -1);
  return w;
};

/**
 * A type phrase — "creature", "nontoken creature", "artifact or enchantment",
 * "Elf", "Zombie creature", "noncreature artifact", "creature token" — as a
 * `CardFilter`. `null` for anything with a word it doesn't know.
 */
export function parseTypePhrase(phrase, { cards = false } = {}) {
  const words = phrase.trim().split(/\s+/);
  const filter = {};
  const types = [];
  const notTypes = [];
  const anyOf = [];
  for (let i = 0; i < words.length; i += 1) {
    const raw = words[i];
    const w = singular(raw.replace(/,$/, ""));
    if (w === "or" || w === "and/or") {
      // "creature or planeswalker" is either type. "artifact creature or
      // Vehicle" is (artifact creature) or (Vehicle), which one filter can't
      // say, so only a lone type before the "or" is read.
      if (types.length !== 1 || filter.subtype !== undefined) return null;
      anyOf.push(types.pop());
      continue;
    }
    // Only another type can follow the "or": "creature or token" is a
    // creature or any token, not a creature token (Ice Cream Kitty).
    if (anyOf.length > 0 && !CARD_TYPES.includes(w)) return null;
    // On the battlefield everything is a permanent. Among cards (a graveyard,
    // a library) a "permanent card" is one that isn't an instant or sorcery.
    if (w === "permanent" || w === "permanents") {
      if (cards) notTypes.push("instant", "sorcery");
      continue;
    }
    if (w === "nontoken") filter.token = false;
    else if (w === "token" || w === "tokens") filter.token = true;
    else if (w === "legendary") filter.supertype = "legendary";
    else if (w === "basic") filter.supertype = "basic";
    else if (w === "nonland" || w === "noncreature" || w === "nonartifact" || w === "nonenchantment") {
      notTypes.push(w.slice(3));
    } else if (CARD_TYPES.includes(w)) {
      if (anyOf.length > 0) anyOf.push(w);
      else types.push(w);
    } else if (/^[A-Z][a-z]+$/.test(w) && !["You", "Your"].includes(w)) {
      // A subtype, singular as printed after a quantity ("an Elf"). Not as
      // an alternative to a type ("creature or Vehicle").
      if (filter.subtype !== undefined || anyOf.length > 0) return null;
      filter.subtype = w;
    } else return null;
  }
  // Whether "nontoken" or "legendary" before an "or" reaches past it is the
  // card's to say, not the parser's.
  if (anyOf.length > 0 && (filter.token !== undefined || filter.supertype !== undefined || notTypes.length > 0)) {
    return null;
  }
  if (anyOf.length > 0) filter.typesAnyOf = anyOf;
  if (types.length === 1) filter.type = types[0];
  else if (types.length > 1) filter.types = types;
  if (notTypes.length > 0) filter.notTypes = notTypes;
  return filter;
}

// --------------------------------------------------------------- targets

/** Target phrases, longest first, as the engine's target specs. */
const TARGET_PHRASES = [
  ["target creature or planeswalker an opponent controls", { kind: "permanent", whose: "opponent", filter: { typesAnyOf: ["creature", "planeswalker"] } }],
  ["target creature or planeswalker", { kind: "permanent", whose: "any", filter: { typesAnyOf: ["creature", "planeswalker"] } }],
  ["target nonland permanent an opponent controls", "nonland-permanent-an-opponent-controls"],
  ["target nonland permanent you don't control", "nonland-permanent-an-opponent-controls"],
  ["target creature an opponent controls", "creature-an-opponent-controls"],
  ["target creature you don't control", "creature-an-opponent-controls"],
  ["target artifact an opponent controls", "artifact-an-opponent-controls"],
  ["target artifact you don't control", "artifact-an-opponent-controls"],
  ["target creature you control", "creature-you-control"],
  ["target land you control", "land-you-control"],
  ["target artifact or enchantment", "artifact-or-enchantment"],
  ["target creature or enchantment", "creature-or-enchantment"],
  ["target artifact or creature", "artifact-or-creature"],
  ["target nonartifact creature", "nonartifact-creature"],
  ["target nonblack creature", "nonblack-creature"],
  ["target attacking or blocking creature", "attacking-or-blocking-creature"],
  ["target nonland permanent", "nonland-permanent"],
  ["target noncreature spell", "noncreature-spell"],
  ["target instant or sorcery spell", "instant-or-sorcery-spell"],
  ["target creature spell", "creature-spell"],
  ["target spell", "spell"],
  ["target creature", "creature"],
  ["target artifact", "artifact"],
  ["target enchantment", "enchantment"],
  ["target land", "land"],
  ["target permanent", "permanent"],
  ["target player or planeswalker", "player-or-planeswalker"],
  ["target opponent or planeswalker", "opponent-or-planeswalker"],
  ["target player", "player"],
  ["target opponent", "opponent"],
  ["any target", "any-target"],
];
const targetOf = (phrase) => TARGET_PHRASES.find(([p]) => p === phrase.toLowerCase())?.[1];
// Non-capturing: a template wraps it in its own group where it wants the match,
// so a nested group never shifts the numbering of the ones after it.
const TARGET = `(?:${TARGET_PHRASES.map(([p]) => escapeRe(p)).join("|")})`;

/** "target creature card from your graveyard" and friends. */
function graveyardTargetOf(phrase) {
  const m = /^target (.+?) card from (your|a|an opponent's) graveyard$/i.exec(phrase);
  if (!m) return undefined;
  const filter = parseTypePhrase(m[1], { cards: true });
  if (filter === null) return undefined;
  const whose = m[2] === "your" ? "you" : m[2] === "a" ? "any" : "opponent";
  return { kind: "card-in-graveyard", whose, filter };
}

// ----------------------------------------------------------------- costs

const MANA = /^(?:\{(?:\d+|[WUBRGCXS]|[WUBRG]\/[WUBRGP]|2\/[WUBRG])\})+$/;

/**
 * An activated ability's cost, "{2}{G}, {T}, Sacrifice ~" → `{ cost, extra }`
 * (`extra` holds ability-level fields a cost implies: `otherOnly`, `zone`).
 * `null` when any part is one the engine can't pay.
 */
export function parseCost(text) {
  const cost = { mana: null, tap: false };
  const extra = {};
  for (const part of text.split(/,\s*/)) {
    let m;
    if (MANA.test(part)) cost.mana = part;
    else if (part === "{T}") cost.tap = true;
    else if (part === "Sacrifice ~") cost.sacrifice = "self";
    else if ((m = /^Sacrifice (a|an|another) (.+)$/.exec(part))) {
      const filter = parseTypePhrase(m[2]);
      if (filter === null) return null;
      cost.sacrifice = Object.keys(filter).length === 1 && filter.type === "creature" ? "creature-you-control" : { filter };
      if (m[1] === "another") extra.otherOnly = true;
    } else if ((m = /^Pay (\d+) life$/.exec(part))) cost.payLife = Number(m[1]);
    else if (part === "Discard your hand") cost.discardHand = true;
    else if ((m = new RegExp(`^Remove ${N} ([+-]\\d+/[+-]\\d+|\\w+) counters? from ~$`, "i").exec(part))) {
      const count = numberOf(m[1]);
      if (typeof count !== "number") return null;
      cost.removeCounter = { kind: m[2], count };
    } else if ((m = /^(\{E\})+$/.exec(part))) cost.payEnergy = part.length / 3;
    else if ((m = new RegExp(`^Tap ${N} untapped (.+?) you control$`, "i").exec(part))) {
      const count = numberOf(m[1]);
      const filter = parseTypePhrase(m[2]);
      if (typeof count !== "number" || filter === null) return null;
      cost.tapOthers = { count, filter: { ...filter, controlledBy: "you" } };
    } else if (part === "Exile ~ from your graveyard") extra.zone = "graveyard";
    else if (part === "Discard ~") extra.zone = "hand";
    else if (part === "Exile ~") cost.exileSelf = true;
    else return null;
  }
  // Without a {T} of its own, the source may be one of the creatures it taps
  // (Nullmage Shepherd).
  if (cost.tapOthers !== undefined && !cost.tap) cost.tapOthers = { ...cost.tapOthers, includeSelf: true };
  return { cost, extra };
}

// -------------------------------------------------------------- triggers

const STEPS = {
  upkeep: "upkeep",
  "draw step": "draw",
  "end step": "end",
  "precombat main phase": "precombat-main",
  "postcombat main phase": "postcombat-main",
  "postcombat main phases": "postcombat-main",
};
const WHO_STEP = { your: "you", "each of your": "you", each: "any", the: "any", "each opponent's": "opponent", "each player's": "any" };

/**
 * A trigger clause ("Whenever another creature you control enters") as one or
 * more trigger specs — two for "enters or attacks". `null` when no template
 * matches.
 */
export function parseTrigger(clause) {
  const c = clause.replace(/\s+/g, " ").trim();
  let m;
  const self = (on) => [{ on, who: "self" }];
  if (/^When(?:ever)? ~ enters$/.test(c)) return self("enters-battlefield");
  if (/^When(?:ever)? ~ enters or attacks$/.test(c)) return [...self("enters-battlefield"), ...self("attacks")];
  if (/^When(?:ever)? ~ dies$/.test(c)) return self("dies");
  if (/^When(?:ever)? ~ leaves the battlefield$/.test(c)) return self("leaves-battlefield");
  if (/^Whenever ~ attacks$/.test(c)) return self("attacks");
  if (/^Whenever ~ blocks$/.test(c)) return self("blocks");
  if (/^Whenever ~ becomes blocked$/.test(c)) return self("becomes-blocked");
  if (/^Whenever ~ attacks or blocks$/.test(c)) return [...self("attacks"), ...self("blocks")];
  if (/^Whenever ~ deals combat damage to a player$|^Whenever ~ deals combat damage to an opponent$/.test(c)) {
    return self("deals-combat-damage-to-player");
  }
  if (/^Whenever ~ is dealt damage$/.test(c)) return self("dealt-damage");
  if (/^Whenever ~ becomes the target of a spell or ability an opponent controls$/.test(c)) {
    return [{ on: "becomes-target", who: "self", byOpponentOnly: true }];
  }
  if (/^When you cast (?:~|this spell)$/.test(c)) return [{ on: "this-cast" }];
  if (/^Whenever you attack$/.test(c)) return [{ on: "attack-with", who: "you", atLeast: 1 }];

  // "Whenever [another] [nontoken] <type> [you control | an opponent controls] enters / dies / attacks"
  if ((m = /^Whenever (a|an|another) (.+?)(?: (you control|an opponent controls))? (enters|dies|attacks)$/.exec(c))) {
    const filter = parseTypePhrase(m[2]);
    if (filter === null) return null;
    const on = { enters: "enters-battlefield", dies: "dies", attacks: "attacks" }[m[4]];
    if (on === "attacks" && m[3] !== "you control") return null;
    const who = m[3] === "you control" ? "you-control" : "any";
    if (m[3] === "an opponent controls") filter.controlledBy = "opponent";
    return [{ on, who, filter, ...(m[1] === "another" ? { otherOnly: true } : {}) }];
  }
  if ((m = /^Whenever (a|another) (.+?) you control deals combat damage to a player$/.exec(c))) {
    const filter = parseTypePhrase(m[2]);
    if (filter === null) return null;
    return [{ on: "deals-combat-damage-to-player", who: "you-control", filter, ...(m[1] === "another" ? { otherOnly: true } : {}) }];
  }
  if ((m = /^Whenever one or more (.+?) you control deal combat damage to a player$/.exec(c))) {
    const filter = parseTypePhrase(m[1]);
    if (filter === null) return null;
    return [{ on: "deals-damage-batch", who: "you-control", filter, combat: true }];
  }

  // Casting.
  if ((m = /^Whenever (you|an opponent|a player) casts? (a|an|your first|their first) (?:(.+?) )?spell(?: each turn)?$/.exec(c))) {
    const who = { you: "you", "an opponent": "opponent", "a player": "any" }[m[1]];
    const spec = { on: "cast-spell", who };
    if (/first/.test(m[2])) spec.firstEachTurn = true;
    if (m[3] !== undefined) {
      if (m[3] === "noncreature") spec.noncreatureOnly = true;
      else {
        const filter = parseTypePhrase(m[3]);
        if (filter === null) return null;
        spec.filter = filter;
      }
    }
    return [spec];
  }
  if (/^Whenever you cast or copy an instant or sorcery spell$/.test(c)) {
    return [{ on: "cast-spell", who: "you", orCopy: true, filter: { typesAnyOf: ["instant", "sorcery"] } }];
  }

  // Players.
  if ((m = /^Whenever (you|an opponent|a player) draws? a card$/.exec(c))) {
    return [{ on: "draws", who: { you: "you", "an opponent": "opponent", "a player": "any" }[m[1]] }];
  }
  if (/^Whenever you gain life$/.test(c)) return [{ on: "gains-life", who: "you" }];
  if ((m = /^Whenever (you lose|an opponent loses) life$/.exec(c))) {
    return [{ on: "loses-life", who: m[1] === "you lose" ? "you" : "opponent" }];
  }
  if ((m = /^Whenever you sacrifice (a|an|another) (.+)$/.exec(c))) {
    const filter = parseTypePhrase(m[2]);
    if (filter === null) return null;
    return [
      {
        on: "sacrifice",
        who: "you",
        // "a permanent" narrows nothing.
        ...(Object.keys(filter).length > 0 ? { filter } : {}),
        ...(m[1] === "another" ? { otherOnly: true } : {}),
      },
    ];
  }
  if (/^Whenever you discard one or more cards$/.test(c)) return [{ on: "discards", who: "you" }];
  if (/^Whenever you surveil$/.test(c)) return [{ on: "surveils", who: "you" }];

  // Steps.
  if (/^At the beginning of combat on your turn$/.test(c)) return [{ on: "step-begins", step: "begin-combat", who: "you" }];
  if (/^At the beginning of each combat$/.test(c)) return [{ on: "step-begins", step: "begin-combat", who: "any" }];
  if ((m = /^At the beginning of (your|each of your|each|the|each opponent's|each player's) (upkeep|draw step|end step|precombat main phase|postcombat main phases?)$/.exec(c))) {
    return [{ on: "step-begins", step: STEPS[m[2]], who: WHO_STEP[m[1]] }];
  }
  return null;
}

// --------------------------------------------------------------- effects

/**
 * One sentence of an effect as an `EffectSpec`, or `null`. `ctx.target(spec)`
 * allocates a target slot and returns its index; `ctx.tokenFor(desc)` names
 * the engine token a "create" means.
 */
/** "Other creatures you control" means other than the source only on a
 * permanent's ability that hasn't named a target: on a spell, or after "target
 * creature", the one it excludes is the target (Exhilarating Elocution). */
const otherMeansSource = (ctx) => !ctx.spell && ctx.targets.length === 0;

export function parseSentence(sentence, ctx) {
  const s = sentence.replace(/\s+/g, " ").trim();
  // "…, where X is the number of …" / "for each …" define an amount by a rule
  // of their own; no template reads one, and matching the rest would take the
  // X for a cast-time X.
  if (/\bwhere X\b|\bfor each\b/i.test(s)) return null;
  let m;
  const re = (src) => new RegExp(`^${src}\\.$`, "i");
  const amount = (w) => numberOf(w);
  const slot = (phrase) => {
    const spec = targetOf(phrase) ?? graveyardTargetOf(phrase);
    return spec === undefined ? undefined : ctx.target(spec);
  };

  // Cards.
  if ((m = re(`(?:you )?draw ${N} cards?`).exec(s))) return { kind: "draw", amount: amount(m[1]) };
  if ((m = re(`(target player|target opponent) draws ${N} cards?`).exec(s))) {
    return { kind: "draw", amount: amount(m[2]), target: slot(m[1]) };
  }
  if ((m = re(`each player draws ${N} cards?`).exec(s))) return { kind: "draw", amount: amount(m[1]), who: "each-player" };
  if ((m = re(`draw ${N} cards?, then discard ${N} cards?`).exec(s))) {
    return {
      kind: "sequence",
      effects: [
        { kind: "draw", amount: amount(m[1]) },
        { kind: "discard", target: "you", amount: amount(m[2]) },
      ],
    };
  }
  if ((m = re(`discard ${N} cards?`).exec(s))) return { kind: "discard", target: "you", amount: amount(m[1]) };
  if ((m = re(`(target player|target opponent) discards ${N} cards?`).exec(s))) {
    return { kind: "discard", target: slot(m[1]), amount: amount(m[2]) };
  }
  if ((m = re(`each opponent discards ${N} cards?`).exec(s))) {
    return { kind: "discard", target: "each-opponent", amount: amount(m[1]) };
  }
  if ((m = re(`mill ${N} cards?`).exec(s))) return { kind: "mill", target: "you", amount: amount(m[1]) };
  if ((m = re(`(target player|target opponent) mills ${N} cards?`).exec(s))) {
    return { kind: "mill", target: slot(m[1]), amount: amount(m[2]) };
  }
  if ((m = re(`each opponent mills ${N} cards?`).exec(s))) {
    return { kind: "mill", target: "each-opponent", amount: amount(m[1]) };
  }
  if ((m = re(`scry ${N}`).exec(s))) return { kind: "scry", amount: amount(m[1]) };
  if ((m = re(`surveil ${N}`).exec(s))) return { kind: "surveil", amount: amount(m[1]) };

  // Life.
  if ((m = re(`(?:you )?gain ${N} life`).exec(s))) return { kind: "gain-life", amount: amount(m[1]) };
  if ((m = re(`each opponent loses ${N} life`).exec(s))) {
    return { kind: "lose-life", amount: amount(m[1]), who: "each-opponent" };
  }
  if ((m = re(`(target player|target opponent) loses ${N} life`).exec(s))) {
    return { kind: "lose-life", amount: amount(m[2]), target: slot(m[1]) };
  }
  if ((m = re(`each opponent loses ${N} life and you gain ${N} life`).exec(s))) {
    return {
      kind: "sequence",
      effects: [
        { kind: "lose-life", amount: amount(m[1]), who: "each-opponent" },
        { kind: "gain-life", amount: amount(m[2]) },
      ],
    };
  }
  if ((m = re(`each opponent loses ${N} life and you gain that much life`).exec(s))) {
    const n = amount(m[1]);
    return {
      kind: "sequence",
      effects: [
        { kind: "lose-life", amount: n, who: "each-opponent" },
        { kind: "gain-life", amount: { product: [n, { countPlayers: "each-opponent" }] } },
      ],
    };
  }

  // Damage.
  if ((m = re(`~ deals ${N} damage to (${TARGET})`).exec(s))) {
    return { kind: "damage", amount: amount(m[1]), target: slot(m[2]) };
  }
  if ((m = re(`~ deals ${N} damage to each opponent`).exec(s))) {
    return { kind: "damage", amount: amount(m[1]), who: "each-opponent" };
  }
  if ((m = re(`~ deals ${N} damage to each player`).exec(s))) {
    return { kind: "damage", amount: amount(m[1]), who: "each-player" };
  }
  if ((m = re(`~ deals ${N} damage to each creature`).exec(s))) {
    return { kind: "damage-all", amount: amount(m[1]), filter: { type: "creature" } };
  }
  if ((m = re(`~ deals ${N} damage to each creature your opponents control`).exec(s))) {
    return { kind: "damage-all", amount: amount(m[1]), filter: { type: "creature", controlledBy: "opponent" } };
  }
  if ((m = re(`~ fights (${TARGET})`).exec(s))) return { kind: "fight", a: "source", b: slot(m[1]) };

  // Tokens.
  // One kind of token, its "with" a list of keywords only: "create a Food
  // token or a Treasure token", "…with deathtouch and a 3/3 … with lifelink"
  // and a token with a quoted ability are left to a person.
  const KWS = `${KW}(?:(?:, | and |, and )${KW})*`;
  if ((m = re(`create ${N} (tapped )?([^"“]+?) tokens?(?: with (${KWS}))?`).exec(s)) && !/ or | and an? /.test(m[3])) {
    const name = ctx.tokenFor?.(`${m[3]}${m[4] ? ` with ${m[4]}` : ""}`) ?? null;
    if (name === null) return null;
    return { kind: "create-token", token: name, count: amount(m[1]), ...(m[2] ? { tapped: true } : {}) };
  }
  if (re("investigate").test(s)) return { kind: "create-token", token: "Clue Token", count: 1 };

  // Counters.
  if ((m = re(`put ${N} \\+1/\\+1 counters? on (~|${TARGET}|each creature you control|each other creature you control)`).exec(s))) {
    const n = amount(m[1]);
    if (m[2] === "~") return { kind: "add-counter", target: "source", counter: "+1/+1", amount: n };
    if (/^each/.test(m[2])) {
      if (/other/.test(m[2]) && !otherMeansSource(ctx)) return null;
      return {
        kind: "add-counter-all",
        filter: { type: "creature", controlledBy: "you" },
        counter: "+1/+1",
        amount: n,
        ...(/other/.test(m[2]) ? { exceptSource: true } : {}),
      };
    }
    return { kind: "add-counter", target: slot(m[2]), counter: "+1/+1", amount: n };
  }
  if (re("proliferate").test(s)) return { kind: "proliferate" };

  // Removal and movement.
  if ((m = re(`destroy (${TARGET})`).exec(s))) return { kind: "destroy", target: slot(m[1]) };
  if ((m = re(`exile (${TARGET})`).exec(s))) return { kind: "exile", target: slot(m[1]) };
  if ((m = re(`return (${TARGET}) to its owner's hand`).exec(s))) {
    // A spell is on the stack: "return target spell to its owner's hand"
    // (Unsubstantiate, Take It Back) takes it from there. Without `from`,
    // return-to-hand bounces a permanent and would do nothing to a spell.
    const spec = targetOf(m[1]);
    const onStack = typeof spec === "string" ? spec.endsWith("spell") : spec?.kind === "spell";
    return { kind: "return-to-hand", target: slot(m[1]), ...(onStack ? { from: "stack" } : {}) };
  }
  if (re("return ~ to its owner's hand").test(s)) return { kind: "return-to-hand", target: "source" };
  if ((m = re(`tap (${TARGET})`).exec(s))) return { kind: "tap", target: slot(m[1]) };
  if ((m = re(`untap (${TARGET})`).exec(s))) return { kind: "untap", target: slot(m[1]) };
  if (re("untap ~").test(s)) return { kind: "untap", target: "source" };
  if ((m = re(`counter (${TARGET})`).exec(s))) {
    const t = targetOf(m[1]);
    if (typeof t !== "string" || !/spell$/.test(t)) return null;
    return { kind: "counter", target: slot(m[1]) };
  }
  if ((m = /^return (target .+? card from your graveyard) to your hand\.$/i.exec(s))) {
    const i = slot(m[1]);
    return i === undefined ? null : { kind: "return-to-hand", target: i, from: "graveyard" };
  }
  if ((m = /^return (target .+? card from your graveyard) to the battlefield( tapped)?\.$/i.exec(s))) {
    // An Aura put onto the battlefield this way isn't attached to anything
    // (BACKLOG), so a card that names one (Rise to Glory) is left to author.
    if (/\bAura\b/.test(m[1])) return null;
    const i = slot(m[1]);
    return i === undefined ? null : { kind: "put-onto-battlefield", target: i, ...(m[2] ? { enterTapped: true } : {}) };
  }
  if (re("sacrifice ~").test(s)) return { kind: "sacrifice-source" };
  if ((m = re(`(each player|each opponent|target player|target opponent) sacrifices ${N} (.+?)(?: of their choice)?`).exec(s))) {
    const count = amount(m[2]);
    const filter = parseTypePhrase(m[3]);
    if (typeof count !== "number" || filter === null) return null;
    const who = { "each player": "each-player", "each opponent": "each-opponent" }[m[1].toLowerCase()];
    if (who !== undefined) return { kind: "sacrifice", who, filter, count };
    ctx.target(targetOf(m[1]));
    return { kind: "sacrifice", who: "target", filter, count };
  }

  // Searching.
  if ((m = /^search your library for an? (.+?) card, put it onto the battlefield( tapped)?, then shuffle\.$/i.exec(s))) {
    const filter = parseTypePhrase(m[1], { cards: true });
    if (filter === null) return null;
    return { kind: "search-library", filter, destination: "battlefield", min: 0, max: 1, ...(m[2] ? { enterTapped: true } : {}) };
  }
  if ((m = /^search your library for an? (.+?) card, reveal it, put it into your hand, then shuffle\.$/i.exec(s))) {
    const filter = parseTypePhrase(m[1], { cards: true });
    if (filter === null) return null;
    return { kind: "search-library", filter, destination: "hand", min: 0, max: 1, reveal: true };
  }
  if ((m = /^search your library for a card, put (?:it|that card) into your hand, then shuffle\.$/i.exec(s))) {
    return { kind: "search-library", filter: {}, destination: "hand", min: 0, max: 1 };
  }

  // Power, toughness and keywords until end of turn.
  if ((m = re(`(~|${TARGET}) gets ([+-]\\d+)/([+-]\\d+) until end of turn`).exec(s))) {
    return {
      kind: "modify-pt",
      target: m[1] === "~" ? "source" : slot(m[1]),
      power: Number(m[2]),
      toughness: Number(m[3]),
      duration: "end-of-turn",
    };
  }
  if ((m = re(`(other )?creatures you control get ([+-]\\d+)/([+-]\\d+) until end of turn`).exec(s))) {
    if (m[1] && !otherMeansSource(ctx)) return null;
    return {
      kind: "modify-pt-all",
      filter: { type: "creature", controlledBy: "you" },
      power: Number(m[2]),
      toughness: Number(m[3]),
      duration: "end-of-turn",
      ...(m[1] ? { exceptSource: true } : {}),
    };
  }
  if ((m = re(`(~|${TARGET}) gains ${KW}(?: and ${KW})? until end of turn`).exec(s))) {
    const target = m[1] === "~" ? "source" : slot(m[1]);
    const kws = [m[2], m[3]].filter(Boolean).map((k) => KEYWORDS[k.toLowerCase()]);
    const one = (keyword) => ({ kind: "grant-keyword", target, keyword, duration: "end-of-turn" });
    return kws.length === 1 ? one(kws[0]) : { kind: "sequence", effects: kws.map(one) };
  }
  if ((m = re(`(other )?creatures you control gain ${KW}(?: and ${KW})? until end of turn`).exec(s))) {
    if (m[1] && !otherMeansSource(ctx)) return null;
    const kws = [m[2], m[3]].filter(Boolean).map((k) => KEYWORDS[k.toLowerCase()]);
    const one = (keyword) => ({
      kind: "grant-keyword-all",
      filter: { type: "creature", controlledBy: "you" },
      keyword,
      duration: "end-of-turn",
      ...(m[1] ? { exceptSource: true } : {}),
    });
    return kws.length === 1 ? one(kws[0]) : { kind: "sequence", effects: kws.map(one) };
  }

  // Mana.
  if ((m = /^add ((?:\{[WUBRGC]\})+)\.$/i.exec(s))) {
    const units = m[1].match(/[WUBRGC]/g);
    // One type is that type, N times; several are one of each ("Add {W}{U}"),
    // N times over when each appears N times ("{W}{W}{U}{U}").
    const types = [...new Set(units)];
    if (types.length === 1) return { kind: "add-mana", mana: units[0], amount: units.length };
    const each = units.length / types.length;
    const even = types.every((t) => units.filter((u) => u === t).length === each);
    return even
      ? { kind: "add-mana", mana: { all: types }, amount: each }
      : { kind: "add-mana", mana: { all: units }, amount: 1 };
  }
  // A choice of colour. In a mana ability the payment picks it; in an ability
  // that uses the stack (a trigger, a spell, a loyalty ability) nothing does,
  // so the choice is written out as modes.
  const choice = (colors, n) =>
    ctx.onStack
      ? {
          kind: "modal",
          minModes: 1,
          maxModes: 1,
          modes: colors.map((c) => ({ text: `Add ${`{${c}}`.repeat(n)}.`, effect: { kind: "add-mana", mana: c, amount: n } })),
        }
      : { kind: "add-mana", mana: colors.length === 5 ? "any-color" : { oneOf: colors }, amount: n };
  if ((m = /^add \{([WUBRGC])\} or \{([WUBRGC])\}\.$/i.exec(s)) || (m = /^add \{([WUBRGC])\}, \{([WUBRGC])\}, or \{([WUBRGC])\}\.$/i.exec(s))) {
    return choice(m.slice(1).filter(Boolean), 1);
  }
  const WUBRG = ["W", "U", "B", "R", "G"];
  if (/^add one mana of any color\.$/i.test(s)) return choice(WUBRG, 1);
  if ((m = new RegExp(`^add ${N} mana of any one color\\.$`, "i").exec(s))) {
    const n = amount(m[1]);
    // In a mana ability, "two mana of any one color" would be any-color x 2,
    // which the auto-payer pays as independently coloured units: BACKLOG's
    // bug:mana-any-one-color (Gilded Lotus). Left to author until that's fixed.
    if (typeof n !== "number" || (n > 1 && !ctx.onStack)) return null;
    return choice(WUBRG, n);
  }

  // Everything else that's a whole instruction by itself.
  if (re("you become the monarch").test(s)) return { kind: "become-monarch" };

  // "You may <sentence>." wraps whatever the inner sentence is.
  if ((m = /^you may (.+)\.$/i.exec(s))) {
    const inner = parseSentence(`${m[1][0].toUpperCase()}${m[1].slice(1)}.`, ctx);
    if (inner === null) return null;
    // A search may already find nothing (`min: 0`) — that is its "may".
    if (inner.kind === "search-library") return inner;
    return { kind: "may", prompt: `${m[1][0].toUpperCase()}${m[1].slice(1)}?`, effect: inner };
  }
  return null;
}

/**
 * An effect's text as one `EffectSpec`: every sentence must parse (then it's
 * that effect, or a `sequence`). Otherwise `effect: null`, with the sentences
 * left to author in `todo` and what the others became in `hints`.
 */
export function parseEffect(text, outer) {
  // Each target a sentence names takes the next slot of the ability's list.
  const ctx = { ...outer, target: (spec) => outer.targets.push(spec) - 1 };
  const sentences = sentencesOf(text);
  const parsed = [];
  const todo = [];
  const hints = [];
  for (const sentence of sentences) {
    const before = ctx.targets.length;
    const effect = parseSentence(sentence, ctx);
    if (effect === null || containsUndefined(effect)) {
      ctx.targets.length = before;
      todo.push(sentence);
    } else {
      parsed.push(effect);
      hints.push({ sentence, effect });
    }
  }
  if (todo.length > 0) return { effect: null, todo, hints };
  return { effect: parsed.length === 1 ? parsed[0] : { kind: "sequence", effects: parsed }, todo: [], hints: [] };
}

/** A template that half-matched: a missing slot, or a number that didn't parse. */
const containsUndefined = (v) =>
  v === undefined ||
  Number.isNaN(v) ||
  (typeof v === "object" && v !== null && Object.values(v).some(containsUndefined));

// ----------------------------------------------------------------- lines

/** The printed (not normalized) sentence, for `text` and TODO comments. */
const printed = (line) => stripReminder(line);

/**
 * A whole face. Returns plain definition data — `keywords`, `pairing`,
 * `targets`/`effect` (a spell's), `castModal`, `activated`, `triggered`,
 * `static`, `cycling`, `flashback`, `cantBeCountered` — plus `todo` (whole
 * lines no tier understood) and `complete` (nothing left to author).
 */
export function parseFace(face, ctx = {}) {
  const out = { keywords: [], activated: [], triggered: [], static: [], todo: [] };
  const lines = (face.oracle_text ?? "").split("\n").filter(Boolean);
  const isSpell = /\b(Instant|Sorcery)\b/.test(face.type_line ?? "");
  const tokenFor = ctx.tokenFor ?? (() => null);
  const spellTargets = [];

  for (let i = 0; i < lines.length; i += 1) {
    const raw = lines[i];
    const whole = normalize(raw, face.name);
    // An ability word or flavor word ("Landfall —", "Crushing Teeth —") means
    // nothing, so it's dropped. A few labels written the same way do mean
    // something: Exhaust and Boast restrict an activated ability and become
    // its flags, and the rest aren't read at all.
    // (A villainous choice's dash isn't a label either: what comes before it
    // is the trigger or instruction.)
    if (MEANINGFUL_LABEL.test(whole) || / villainous choice — /.test(whole)) { out.todo.push(printed(raw)); continue; }
    const label = /^(Exhaust|Boast) — /.exec(whole)?.[1];
    const line = label ? whole.slice(label.length + 3) : whole.replace(/^[A-Z][\w' ,-]+ — (?=[A-Z~{+−-])/, "");
    if (label && !/^[^:]+: /.test(line)) { out.todo.push(printed(raw)); continue; }
    if (line === "") continue;
    let m;

    // Keywords, partner abilities, ward, and lines with no behaviour of their own.
    // A keyword line — "Flying, ward {2}" — each part a modeled keyword or a
    // plain ward; one part of anything else leaves the whole line to a person.
    const parts = line.split(/,\s*|;\s*/);
    const wardOf = (p) => {
      const w = /^ward ((?:\{[0-9WUBRGC]+\})+)$/i.exec(p) ?? /^ward—pay (\d+) life\.?$/i.exec(p);
      if (w === null) return null;
      return /^\{/.test(w[1]) ? { mana: w[1] } : { payLife: Number(w[1]) };
    };
    if (parts.every((p) => KEYWORDS[p.toLowerCase()] !== undefined || wardOf(p) !== null)) {
      for (const p of parts) {
        if (KEYWORDS[p.toLowerCase()] !== undefined) out.keywords.push(KEYWORDS[p.toLowerCase()]);
        else out.triggered.push(wardAbility(wardOf(p)));
      }
      continue;
    }
    if (line === "~ can be your commander.") continue;
    if (line === "Partner") { out.pairing = { kind: "partner" }; continue; }
    if ((m = /^Partner with (.+)$/.exec(line))) {
      out.pairing = { kind: "partner-with", name: m[1] };
      out.triggered.push(partnerWithAbility(m[1]));
      continue;
    }
    if ((m = /^Partner—(.+)$/.exec(line))) { out.pairing = { kind: "partner-group", group: m[1] }; continue; }
    if (line === "Friends forever") { out.pairing = { kind: "partner-group", group: "Friends forever" }; continue; }
    if (line === "Choose a Background") { out.pairing = { kind: "choose-a-background" }; continue; }
    if (line === "Doctor's companion") { out.pairing = { kind: "doctors-companion" }; continue; }
    if ((m = /^Ward ((?:\{[0-9WUBRGC]+\})+)$/.exec(line))) { out.triggered.push(wardAbility({ mana: m[1] })); continue; }
    if ((m = /^Ward—Pay (\d+) life\.$/.exec(line))) { out.triggered.push(wardAbility({ payLife: Number(m[1]) })); continue; }

    // Card-level lines.
    if ((m = /^Enchant (creature|land|artifact|enchantment|permanent|creature you control|creature or planeswalker)$/.exec(line))) {
      out.enchant = targetOf(`target ${m[1]}`);
      continue;
    }
    if ((m = /^Equip ((?:\{[^}]+\})+)$/.exec(line))) {
      out.activated.push({
        cost: { mana: m[1], tap: false },
        targets: ["creature-you-control"],
        effect: { kind: "attach", target: 0 },
        resolve: null,
        text: printed(raw),
        sorcerySpeed: true,
      });
      continue;
    }
    if ((m = /^Cycling ((?:\{[^}]+\})+)$/.exec(line))) { out.cycling = { cost: m[1] }; continue; }
    if ((m = /^Flashback ((?:\{[^}]+\})+)$/.exec(line))) { out.flashback = { cost: m[1] }; continue; }
    if (line === "~ can't be countered.") { out.cantBeCountered = true; continue; }

    // Static lines.
    const st = parseStatic(line, printed(raw));
    if (st !== null) { out.static.push(st); continue; }

    // Loyalty abilities.
    if ((m = /^([+−-]?)(\d+|X): (.+)$/.exec(line)) && face.loyalty !== undefined) {
      const n = m[2] === "X" ? null : Number(m[2]) * (m[1] === "" || m[1] === "+" ? 1 : -1);
      // The engine has no X loyalty cost; 0 keeps the skeleton compiling, and
      // the TODO keeps it out of review/.
      const ability = { loyaltyCost: n ?? 0, cost: { mana: null, tap: false }, targets: [], effect: null, resolve: null, text: printed(raw) };
      if (n === null) { ability.__todo = ["an X loyalty cost"]; }
      fillEffect(ability, m[3], { tokenFor, onStack: true }, lines, i);
      out.activated.push(ability);
      continue;
    }

    // Activated abilities: "cost: effect".
    const colon = line.indexOf(": ");
    if (colon > 0 && !/^(When|Whenever|At )/.test(line)) {
      const parsedCost = parseCost(line.slice(0, colon));
      if (parsedCost === null) { out.todo.push(printed(raw)); continue; }
      const ability = { cost: parsedCost.cost, targets: [], effect: null, resolve: null, text: printed(raw), ...parsedCost.extra };
      if (label === "Exhaust") ability.exhaust = true;
      if (label === "Boast") ability.boast = true;
      let rest = line.slice(colon + 2);
      const restrictions = [];
      rest = rest.replace(/ Activate only (as a sorcery|once each turn|during your turn)\.$/, (_x, r) => {
        restrictions.push(r);
        return "";
      });
      rest = rest.replace(/ Activate only (as a sorcery|once each turn|during your turn)\.$/, (_x, r) => {
        restrictions.push(r);
        return "";
      });
      if (restrictions.includes("as a sorcery")) ability.sorcerySpeed = true;
      if (restrictions.includes("once each turn")) ability.oncePerTurn = true;
      if (restrictions.includes("during your turn")) ability.condition = { kind: "your-turn" };
      if (/Activate only /.test(rest)) {
        ability.__todo = [`a restriction: "${rest.slice(rest.indexOf("Activate only "))}"`];
        rest = rest.slice(0, rest.indexOf(" Activate only "));
      }
      i = fillEffect(ability, rest, { tokenFor }, lines, i);
      manaAbilityExtras(ability);
      out.activated.push(ability);
      continue;
    }

    // Triggered abilities: "When/Whenever/At …, effect".
    if (/^(When|Whenever|At )/.test(line)) {
      const comma = line.indexOf(", ");
      const clause = comma > 0 ? line.slice(0, comma) : line;
      const triggers = parseTrigger(clause);
      if (triggers === null) { out.todo.push(printed(raw)); continue; }
      let rest = comma > 0 ? line.slice(comma + 2) : "";
      let oncePerTurn = false;
      rest = rest.replace(/ This ability triggers only once each turn\.$/, () => {
        oncePerTurn = true;
        return "";
      });
      const base = { targets: [], effect: null, resolve: null, text: printed(raw), ...(oncePerTurn ? { oncePerTurn: true } : {}) };
      if (/^if /i.test(rest)) {
        // An intervening-if (rule 603.4) belongs in `condition`, which isn't parsed.
        base.__todo = [`the intervening-if: "${rest.slice(0, rest.indexOf(",") + 1)}"`];
        rest = rest.slice(rest.indexOf(", ") + 2);
        rest = rest[0].toUpperCase() + rest.slice(1);
      } else rest = rest.length > 0 ? rest[0].toUpperCase() + rest.slice(1) : rest;
      const first = { trigger: triggers[0], ...base };
      const next = fillEffect(first, rest, { tokenFor, onStack: true }, lines, i);
      out.triggered.push(first);
      for (const t of triggers.slice(1)) out.triggered.push({ ...first, trigger: t, targets: [...first.targets] });
      i = next;
      continue;
    }

    // A spell's own text: every line of an instant or sorcery is its effect.
    if (isSpell) {
      out.spellLines = [...(out.spellLines ?? []), { raw, line, index: i }];
      continue;
    }
    out.todo.push(printed(raw));
  }

  // A spell: its lines are one effect (a modal one if it opens "Choose …").
  if (out.spellLines) {
    const modal = parseModalSpell(out.spellLines, { tokenFor, onStack: true, spell: true });
    if (modal !== undefined) {
      if (modal === null) out.todo.push(...out.spellLines.map((l) => printed(l.raw)));
      else Object.assign(out, modal);
    } else {
      const ctx2 = { targets: spellTargets, tokenFor, onStack: true, spell: true };
      const text = out.spellLines.map((l) => l.line).join(" ");
      const r = parseEffect(text, ctx2);
      out.targets = spellTargets;
      out.effect = r.effect;
      if (r.effect === null) {
        out.todo.push(...r.todo);
        out.effectHints = r.hints;
      }
    }
    delete out.spellLines;
  }

  out.complete =
    out.todo.length === 0 &&
    [...out.activated, ...out.triggered].every((a) => a.effect !== null && a.__todo === undefined);
  return out;
}

/** Fill `ability.effect` / `targets` from its effect text; a "choose one —"
 * swallows the bullet lines after it. Returns the last line index used. */
/** Effects that move cards to or from a library. */
const LIBRARY_EFFECTS = new Set([
  "draw", "mill", "search-library", "scry", "surveil", "look-and-choose", "put-on-library", "reveal-until",
]);
const touchesLibrary = (e) =>
  e !== null && typeof e === "object" &&
  (LIBRARY_EFFECTS.has(e.kind) || Object.values(e).some((v) => (Array.isArray(v) ? v.some(touchesLibrary) : touchesLibrary(v))));

/**
 * "{T}: Add {G}{G}. You gain 2 life." is one mana ability (rule 605.1a):
 * whatever follows the mana rides on `add-mana`'s `also`, since a plain
 * sequence with a non-mana step isn't a mana ability and would use the stack.
 * Only an untargeted ability whose other steps make no mana, and none that
 * moves a card to or from a library: those aren't mana abilities (605.1a —
 * Chromatic Sphere's "Add one mana of any color. Draw a card." uses the
 * stack), and a colour choice made on the stack needs authoring.
 */
function manaAbilityExtras(ability) {
  const e = ability.effect;
  if (e?.kind !== "sequence" || e.effects[0]?.kind !== "add-mana" || ability.targets.length > 0) return;
  const rest = e.effects.slice(1);
  if (rest.length === 0 || rest.some((step) => step.kind === "add-mana")) return;
  if (rest.some(touchesLibrary)) {
    ability.__todo = [...(ability.__todo ?? []), "not a mana ability (rule 605.1a: it moves a card to or from a library), so it uses the stack"];
    return;
  }
  ability.effect = { ...e.effects[0], also: rest.length === 1 ? rest[0] : { kind: "sequence", effects: rest } };
}

function fillEffect(ability, text, ctx, lines, i) {
  const modalHead = /^Choose (one|two|one or both|one or more) —$/.exec(text.trim());
  if (modalHead) {
    let j = i + 1;
    const bullets = [];
    while (j < lines.length && lines[j].startsWith("•")) bullets.push(lines[j].replace(/^•\s*/, "")), (j += 1);
    const modes = [];
    let ok = bullets.length > 0;
    for (const b of bullets) {
      const r = parseEffect(b, { targets: [], tokenFor: ctx.tokenFor, onStack: ctx.onStack });
      // A resolution-time mode can't choose targets of its own.
      if (r.effect === null || containsTarget(r.effect)) ok = false;
      else modes.push({ text: b, effect: r.effect });
    }
    const [min, max] = modeCounts(modalHead[1], bullets.length);
    if (ok) ability.effect = { kind: "modal", minModes: min, maxModes: max, modes };
    else ability.__todo = [...(ability.__todo ?? []), `the modes: ${bullets.join(" / ")}`];
    return j - 1;
  }
  const r = parseEffect(text, { targets: ability.targets, tokenFor: ctx.tokenFor, onStack: ctx.onStack });
  ability.effect = r.effect;
  if (r.effect === null) {
    ability.__todo = [...(ability.__todo ?? []), ...r.todo];
    if (r.hints.length > 0) ability.__hint = r.hints;
  }
  return i;
}

const containsTarget = (e) =>
  e !== null && typeof e === "object" && (typeof e.target === "number" || typeof e.b === "number" || Object.values(e).some(containsTarget));

const modeCounts = (head, n) =>
  ({ one: [1, 1], two: [2, 2], "one or both": [1, 2], "one or more": [1, n] })[head];

/** "Choose one —" and its bullets on a spell: a `castModal` (modes may
 * target). `undefined` when the spell isn't modal; `null` when a mode
 * didn't parse. */
function parseModalSpell(spellLines, ctx) {
  const head = /^Choose (one|two|one or both|one or more) —$/.exec(spellLines[0].line);
  if (!head) return undefined;
  const modes = [];
  for (const l of spellLines.slice(1)) {
    if (!l.line.startsWith("•")) return null;
    const text = l.line.replace(/^•\s*/, "");
    const targets = [];
    const r = parseEffect(text, { targets, tokenFor: ctx.tokenFor, onStack: ctx.onStack, spell: ctx.spell });
    if (r.effect === null) return null;
    modes.push({ text: stripReminder(l.raw).replace(/^•\s*/, ""), ...(targets.length ? { targets } : {}), effect: r.effect });
  }
  const [minModes, maxModes] = modeCounts(head[1], modes.length);
  return { castModal: { minModes, maxModes, modes }, effect: null, targets: [] };
}

/** Static lines the engine models in one shape. */
function parseStatic(line, text) {
  let m;
  if (line === "~ enters tapped.") {
    return { affects: { scope: "self" }, replacement: { event: "enters-battlefield", tapped: true }, text };
  }
  if (line === "~ can't block.") return { affects: { scope: "self" }, restrictions: ["cant-block"], text };
  if (line === "~ can't attack or block.") return { affects: { scope: "self" }, restrictions: ["cant-attack", "cant-block"], text };
  if (line === "~ attacks each combat if able.") return { affects: { scope: "self" }, restrictions: ["must-attack"], text };
  if (line === "~ can't be blocked.") return { affects: { scope: "self" }, grantKeywords: ["unblockable"], text };
  if (line === "You have no maximum hand size.") return { affects: { scope: "self" }, noMaxHandSize: true, text };
  if ((m = /^(Other )?creatures you control get ([+-]\d+)\/([+-]\d+)\.$/.exec(line))) {
    return { affects: { scope: "creatures-you-control", ...(m[1] ? { excludeSelf: true } : {}) }, grantPt: [Number(m[2]), Number(m[3])], text };
  }
  if ((m = /^Other ([A-Z][a-z]+) creatures you control get ([+-]\d+)\/([+-]\d+)\.$/.exec(line))) {
    return { affects: { scope: "creatures-you-control", excludeSelf: true, subtype: m[1] }, grantPt: [Number(m[2]), Number(m[3])], text };
  }
  if ((m = new RegExp(`^(Other )?creatures you control have ${KW}(?: and ${KW})?\\.$`, "i").exec(line))) {
    return {
      affects: { scope: "creatures-you-control", ...(m[1] ? { excludeSelf: true } : {}) },
      grantKeywords: [m[2], m[3]].filter(Boolean).map((k) => KEYWORDS[k.toLowerCase()]),
      text,
    };
  }
  if ((m = new RegExp(`^(?:Equipped|Enchanted) creature gets ([+-]\\d+)/([+-]\\d+)(?: and has ${KW}(?: and ${KW})?)?\\.$`, "i").exec(line))) {
    const kws = [m[3], m[4]].filter(Boolean).map((k) => KEYWORDS[k.toLowerCase()]);
    return { affects: { scope: "attached" }, grantPt: [Number(m[1]), Number(m[2])], ...(kws.length ? { grantKeywords: kws } : {}), text };
  }
  if ((m = new RegExp(`^(?:Equipped|Enchanted) creature has ${KW}(?: and ${KW})?\\.$`, "i").exec(line))) {
    return { affects: { scope: "attached" }, grantKeywords: [m[1], m[2]].filter(Boolean).map((k) => KEYWORDS[k.toLowerCase()]), text };
  }
  if ((m = /^(?:Enchanted|Equipped) creature can't attack or block\.$/.exec(line))) {
    return { affects: { scope: "attached" }, restrictions: ["cant-attack", "cant-block"], text };
  }
  return null;
}

const partnerWithAbility = (name) => ({
  trigger: { on: "enters-battlefield", who: "self" },
  targets: ["player"],
  effect: {
    kind: "search-library",
    filter: { name },
    destination: "hand",
    min: 0,
    max: 1,
    reveal: true,
    who: { controllerOfTarget: 0 },
  },
  resolve: null,
  text: `When this creature enters, target player may search their library for a card named ${name}, reveal it, put it into their hand, then shuffle.`,
});

const wardAbility = (cost) => ({
  trigger: { on: "becomes-target", who: "self", byOpponentOnly: true },
  targets: [],
  effect: { kind: "ward", cost },
  resolve: null,
  text: cost.mana ? `Ward ${cost.mana}` : `Ward—Pay ${cost.payLife} life.`,
});

// ------------------------------------------------------------- serializer

const IDENT = /^[A-Za-z_$][\w$]*$/;

/**
 * Plain data as TypeScript source the way the pool writes it: identifier
 * keys bare, short objects on one line, and an ability's `__todo` / `__hint`
 * printed as comments where they belong.
 */
export function toSource(value, indent = "") {
  const inner = `${indent}  `;
  if (value === null) return "null";
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value !== "object") return String(value);
  if (Array.isArray(value)) {
    if (value.length === 0) return "[]";
    const flat = `[${value.map((v) => toSource(v, inner)).join(", ")}]`;
    if (!flat.includes("\n") && flat.length + indent.length < 96) return flat;
    return `[\n${value.map((v) => `${inner}${toSource(v, inner)},`).join("\n")}\n${indent}]`;
  }
  const entries = Object.entries(value).filter(([k, v]) => v !== undefined && !k.startsWith("__"));
  const comments = [
    ...(value.__todo ?? []).map((t) => `${inner}// TODO(scaffold): ${t}`),
    ...(value.__hint ?? []).map((h) => `${inner}// parsed "${h.sentence}" as ${toSource(h.effect, inner).replace(/\n\s*/g, " ")}`),
  ];
  const key = (k) => (IDENT.test(k) ? k : JSON.stringify(k));
  const flat = `{ ${entries.map(([k, v]) => `${key(k)}: ${toSource(v, inner)}`).join(", ")} }`;
  if (comments.length === 0 && !flat.includes("\n") && flat.length + indent.length < 96) return entries.length ? flat : "{}";
  return `{\n${entries.map(([k, v]) => `${inner}${key(k)}: ${toSource(v, inner)},`).join("\n")}${comments.length ? `\n${comments.join("\n")}` : ""}\n${indent}}`;
}
