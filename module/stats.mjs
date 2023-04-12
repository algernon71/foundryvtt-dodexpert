

export function calculateSecondaryStats(stats) {
    for (let [key, ability] of Object.entries(stats.abilities)) {
      // Calculate the modifier using d20 rules.
      ability.group = calculateAbilityGroup (ability.value);
    }

    const maxHitpoints = calculateHitpoints(stats.abilities.STO.value, stats.abilities.FYS.value);
    if (!stats.health ) {
      stats.health = {
        max: maxHitpoints,
        value: maxHitpoints    
      };
    }
    if (!stats.power ) {
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

}

export function calculateMovement(sto, fys, smi) {
  const sum = sto + fys + smi;
  if (sum <= 11) {
    return 7;
  }

  const n = Math.ceil((sum - 11) / 9);
  console.log('calculateMovement,n:' + n);
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
    const val = Math.ceil((sty + sto) / 2);
    
    if (val <= 16) {
      return "";
    }
    if (val <= 20) {
      return "1d4";
    }
    if (val <= 25) {
      return "1d6";
    }
    if (val <= 30) {
      return "1d10";
    }
    const nd6 = Math.ceil((val - 30) / 10) + 1; 
    return nd6 + "d6";
  }
