

export function calculateSecondaryStats(stats) {
  if (stats.abilities) {
    for (let [key, ability] of Object.entries(stats.abilities)) {
      // Calculate the modifier using d20 rules.
      ability.group = calculateAbilityGroup(ability.value);
    }

    const maxHitpoints = calculateHitpoints(stats.abilities.STO.value, stats.abilities.FYS.value);
    if (!stats.health) {
      stats.health = {
        max: maxHitpoints,
        value: maxHitpoints
      };
    }
    if (!stats.power) {
      stats.power = {
        max: stats.abilities.PSY.value,
        value: stats.abilities.PSY.value
      }

    };
    stats.health.max = calculateHitpoints(stats.abilities.STO.value, stats.abilities.FYS.value);
    stats.power.max = stats.abilities.PSY.value;
    stats.initiative = stats.abilities.SMI.group;
    stats.sb = calculateDamageBonus(stats.abilities.STY.value, stats.abilities.STO.value);
    stats.weightCapacity = stats.abilities.STY.value;
    stats.movement = calculateMovement(stats.abilities.STO.value, stats.abilities.FYS.value, stats.abilities.SMI.value);
    if (hasAbility(stats, "Snabb")) {
      stats.initiative += 10;
    }

  }
}

export function hasAbility(stats, name) {
  if (stats.hero) {
    if (stats.hero.ability_row1.indexOf(name) >= 0) {
      return true;
    }
    if (stats.hero.ability_row2.indexOf(name) >= 0) {
      return true;
    }
    if (stats.hero.ability_row3.indexOf(name) >= 0) {
      return true;
    }
    if (stats.hero.ability_row4.indexOf(name) >= 0) {
      return true;
    }
  }

  return false;

}

export function calculateMovement(sto, fys, smi) {
  const sum = sto + fys + smi;
  if (sum <= 11) {
    return 7;
  }

  const n = Math.ceil((sum - 11) / 9);

  return n + 7;
}

export function calculateAbilityGroup(v) {
  if (v <= 3) {
    return 0;
  }
  if (v <= 8) {
    return 1;
  }

  return Math.floor((v - 8) / 4) + 2;
}

export function calculateHitpoints(sto, fys) {
  return Math.ceil((sto + fys) / 2)
}
export function calculateDamageBonus(sty, sto) {
  const val = (sty + sto);

  if (val <= 26) {
    return "";
  }
  if (val <= 27) {
    return "1";
  }

  if (val <= 30) {
    return "1d2";
  }
  if (val <= 33) {
    return "1d4";
  }
  if (val <= 41) {
    return "1d6";
  }
  if (val <= 51) {
    return "1d10";
  }
  if (val <= 61) {
    return "2d6";
  }
  if (val <= 81) {
    return "3d6";
  }
  if (val <= 101) {
    return "4d6";
  }
  return "4d6";

}
