export async function rollAttribute(attribute, favourmod, modifier, armor, weapon, advantage) {
	let d20str = "1d20";
	let detailedRoll = "";
	let dam = "";
	if(favourmod == 1) d20str="2d20kl";
	else if(favourmod == -1) d20str="2d20kh";
    let attributeRoll = new Roll(d20str, {});
    
    attributeRoll.roll();
    
    // console.log("attributeRoll.results["+JSON.stringify(attributeRoll.terms[0]["results"])+"]");
    for( let dd of attributeRoll.terms[0]["results"] ) {
		if(dd["active"] ) {
			detailedRoll += " "+dd["result"];
		} else {
			detailedRoll +=" <del>"+dd["result"]+"<del>";
		}
	}
    
    let isCriticalSuccess = false;
    let isCriticalFailure = false;
    let advantagemod = 0;
    let hasWeapon = weapon != null;
    let hasArmor = armor != null;
       
    
    if(hasWeapon && advantage ) { advantagemod=2 }
    else if (hasArmor && advantage) { advantagemod=-2; }
    		
    let mod = (modifier.value - 10) * -1;
    
    if(hasWeapon && weapon.quality.search(/precise/i) != -1) {
		
		mod++;
	}
    
    let diceTarget = attribute.value + mod + advantagemod;
    
    console.log("diceTarget["+diceTarget+"]");
    
    if( attributeRoll._total === 1 || attributeRoll._total === 20) {
		let critRoll = new Roll("1d20", {});
		critRoll.roll();
		detailedRoll = detailedRoll+ " crit/fumble "+critRoll.total;
		isCriticalSuccess = critRoll.total <= diceTarget && attributeRoll.total === 1;
		isCriticalFailure = critRoll.total > diceTarget && attributeRoll.total === 20;
	}
    
    if (game.dice3d != null) {
        await game.dice3d.showForRoll(attributeRoll);        
    }

    if (hasArmor && attributeRoll.total <= diceTarget) {
        if (armor.protection !== "") {
            let armorRoll = new Roll(armor.protection, {});
            armorRoll.roll();
            if (game.dice3d != null) {
                await game.dice3d.showForRoll(armorRoll);
            }
            armor.value = armorRoll.total;
        } else {
            armor.value = 0;
        }
    }
    if (hasWeapon && attributeRoll.total <= diceTarget) {
        if (weapon.damage !== "") {
			dam = weapon.damage;
			if( advantage ) { 
				dam += "+1d4";
			}
			if( isCriticalSuccess ) {
				dam += "+1d6";
			}
            let weaponRoll = new Roll(dam, {});
            weaponRoll.roll();
            console.log("weaponRoll.results["+JSON.stringify(weaponRoll.terms)+"]");
            if (game.dice3d != null) {
                await game.dice3d.showForRoll(weaponRoll);
            }
            weapon.value = weaponRoll._total;
        } else {
            weapon.value = 0;
        }
    }
    
    console.log("attributeRoll.terms["+JSON.stringify(attributeRoll.terms)+"]");   
    
    let rollData = {
        name: `${attribute.name} (${diceTarget}) ⬅ ${modifier.name} (${mod})`,
        hasSucceed: attributeRoll.total <= diceTarget,
        diceResult: attributeRoll.total,
        result: detailedRoll,
        hasArmor: hasArmor,
        hasWeapon: hasWeapon,
        isAdvantage: advantagemod !== 0,
        isFavour: favourmod != 0,
        isCriticalSuccess: isCriticalSuccess,
        isCriticalFailure: isCriticalFailure,
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

function formatDice(diceResult) {
	return "";
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
    console.log("html["+html+"]");
    
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
