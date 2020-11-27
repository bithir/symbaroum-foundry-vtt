export async function rollAttribute(attribute, favourmod, modifier, armor, weapon, advantage) {
	let d20str = "1d20";
	if(favourmod == 1) d20str="2d20kl";
	else if(favourmod == -1) d20str="2d20kh";
    let attributeRoll = new Roll(d20str, {});
    
    attributeRoll.roll();
    
    console.log("Advantage["+advantage+"]");
    
    let advantagemod = 0;
    let hasWeapon = weapon != null;
    let hasArmor = armor != null;
    
    if(hasWeapon && advantage ) { advantagemod+=2 }
    else if (hasArmor && advantage) { advantagemod-=2; }
    		
    let mod = (modifier.value - 10) * -1;
    let diceTarget = attribute.value + mod + advantagemod;
    
    if (game.dice3d != null) {
        await game.dice3d.showForRoll(attributeRoll);        
    }

    if (hasArmor) {
        if (armor.protection !== "") {
            let armorRoll = new Roll(armor.protection, {});
            armorRoll.roll();
            if (game.dice3d != null) {
                await game.dice3d.showForRoll(armorRoll);
            }
            armor.value = armorRoll._total;
        } else {
            armor.value = 0;
        }
    }
    if (hasWeapon) {
        if (weapon.damage !== "") {
			let dam = weapon.damage;
			if( advantage ) { 
				dam += "+1d4";
			}
            let weaponRoll = new Roll(dam, {});
            weaponRoll.roll();
            if (game.dice3d != null) {
                await game.dice3d.showForRoll(weaponRoll);
            }
            weapon.value = weaponRoll._total;
        } else {
            weapon.value = 0;
        }
    }
    
    console.log("attributeRoll.terms["+JSON.stringify(attributeRoll.terms)+"]");
    console.log("attributeRoll.results["+JSON.stringify(attributeRoll.results)+"]");
    
    let rollData = {
        name: `${attribute.name} (${diceTarget}) ⬅ ${modifier.name} (${mod})`,
        hasSucceed: attributeRoll._total <= diceTarget,
        diceResult: attributeRoll._total,
        result: attributeRoll.result,
        hasArmor: hasArmor,
        hasWeapon: hasWeapon,
        isAdvantage: advantagemod !== 0,
        isFavour: favourmod != 0,
        armor: armor,
        weapon: weapon        
    };
    const html = await renderTemplate("systems/symbaroum/template/chat/roll.html", rollData);
    let chatData = {
        user: game.user._id,
        rollMode: game.settings.get("core", "rollMode"),
        content: html,
    };
    if (["gmroll", "blindroll"].includes(chatData.rollMode)) {
        chatData.whisper = ChatMessage.getWhisperRecipients("GM");
    } else if (chatData.rollMode === "selfroll") {
        chatData.whisper = [game.user];
    }
    ChatMessage.create(chatData);
}

export async function deathRoll(sheet) {
    let death = new Roll("1d20", {});
    death.roll();
    if (game.dice3d != null) {
        await game.dice3d.showForRoll(death);
    }
    let hasSucceed = death._total >= 2 && death._total <= 10;
    let isCriticalSuccess = death._total === 1;
    if (!hasSucceed) sheet.nbrOfFailedDeathRoll++;
    if (isCriticalSuccess) sheet.nbrOfFailedDeathRoll = 0;
    let heal = new Roll("1d4", {});
    heal.roll();
    if (game.dice3d != null) {
        await game.dice3d.showForRoll(heal);
    }
    let rollData = {
        isCriticalSuccess: isCriticalSuccess,
        healing: heal._total,
        isCriticalFailure: death._total === 20 || sheet.nbrOfFailedDeathRoll >= 3,
        hasSucceed: hasSucceed,
        nbrOfFailure: sheet.nbrOfFailedDeathRoll
    };
    const html = await renderTemplate("systems/symbaroum/template/chat/death.html", rollData);
    let chatData = {
        user: game.user._id,
        rollMode: game.settings.get("core", "rollMode"),
        content: html,
    };
    if (["gmroll", "blindroll"].includes(chatData.rollMode)) {
        chatData.whisper = ChatMessage.getWhisperRecipients("GM");
    } else if (chatData.rollMode === "selfroll") {
        chatData.whisper = [game.user];
    }
    ChatMessage.create(chatData);
}
