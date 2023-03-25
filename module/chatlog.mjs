
export function renderChatLog(app, html, data) {
    html.on('click', 'button.roll-damage', rollDamage);
}

export function getChatLogEntryContext(html, options) {
    let canApplyDamage = li => li.find(".damage-value").length;
    options.push({
    name: "Applicera skada",
    icon: '<i class="fa-solid fa-sword"></i>',
    condition: canApplyDamage,
    callback: li => applyDamage(li)
  });
}

function rollDamage(event) {
    console.log('rollDamage', event);
  };
  


function applyDamage(forElement) {
    console.log('applyDamage', forElement);
    const damageElement = forElement.find(".damage-value");
    const damage = parseInt(damageElement.attr("data-damage"));
    console.log('applyDamage:' + damage);
    const targets = game.user.targets;
    targets.forEach(target => {
      const targetActor = target.actor;
      targetActor.applyDamage(10, 1);
  
    });
  }