



export function initSkill(skill, context) {
    const ability = context.system.abilities[skill.system.ability];
    if (skill.system.bc && skill.system.fv < ability.mod) {
        skill.system.fv = ability.mod;
    }
}

export async function giveSkillExperience(skill, xp) {
    let erf = skill.system.erf + xp;
    let fv = skill.system.fv;
    let increaseCost = getSkillIncreaseCost(fv, skill.system.type, skill.system.cost);
    while (increaseCost <= erf && increaseCost > 0 ) {
        fv = fv + 1;
        erf = erf - increaseCost;
    }
    if (increaseCost <= 0) {
        erf = 0;
    }
    let update = { 
        "system": 
        { 
            "fv" : fv,
            "erf": erf
        } 
    };
    await skill.update(update, {});
}

export async function removeSkillExperience(skill, xp) {
    let erf = skill.system.erf - xp;
    let fv = skill.system.fv;
    let increaseCost = getSkillIncreaseCost(fv, skill.system.type, skill.system.cost);
    while (erf < 0) {
        fv = fv - 1;
        erf = erf + 1;
        erf = erf + getSkillIncreaseCost(fv, skill.system.type, skill.system.cost) - 1;
    }
    let update = { 
        "system": 
        { 
            "fv" : fv,
            "erf": erf
        } 
    };
    await skill.update(update, {});
}

function getSkillIncreaseCost(fv, type, baseCost) {
    if (type == "B") {
        return getBSkillMultiplier(fv + 1) * baseCost;

    }
    return getSkillMultiplier(fv + 1) * baseCost;
}

 function getSkillMultiplier(fv) {
    if (fv <= 10) {
        return 1;
    }
    if (fv <= 14) {
        return 2;
    }

    return 3 + Math.floor((fv - 14) / 3); 
}

function getBSkillMultiplier(fv) {
    if (fv <= 2) {
        return 1;
    }
    if (fv <= 4) {
        return 2;
    }
    if (fv <= 5) {
        return 3;
    }

    return -1;
}