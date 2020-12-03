export const migrateWorld = async () => {
    const schemaVersion = 1;
    const worldSchemaVersion = Number(game.settings.get("symbaroum", "worldSchemaVersion"));
    if (worldSchemaVersion !== schemaVersion && game.user.isGM) {
        ui.notifications.info("Upgrading the world, please wait...");
        for (let actor of game.actors.entities) {
            try {
                const update = migrateActorData(actor.data, worldSchemaVersion);
                if (!isObjectEmpty(update)) {
                    await actor.update(update, {enforceTypes: false});
                }
            } catch (e) {
                console.error(e);
            }
        }
        for (let item of game.items.entities) {
            try {
                const update = migrateItemData(item.data, worldSchemaVersion);
                if (!isObjectEmpty(update)) {
                    await item.update(update, {enforceTypes: false});
                }
            } catch (e) {
                console.error(e);
            }
        }
        for (let scene of game.scenes.entities) {
            try {
                const update = migrateSceneData(scene.data, worldSchemaVersion);
                if (!isObjectEmpty(update)) {
                    await scene.update(update, {enforceTypes: false});
                }
            } catch (err) {
                console.error(err);
            }
        }
        for (let pack of game.packs.filter((p) => p.metadata.package === "world" && ["Actor", "Item", "Scene"].includes(p.metadata.entity))) {
            await migrateCompendium(pack, worldSchemaVersion);
        }
        game.settings.set("symbaroum", "worldSchemaVersion", schemaVersion);
        ui.notifications.info("Upgrade complete!");
    }
};

const migrateActorData = (actor, worldSchemaVersion) => {
    const update = {};
    let itemsChanged = false;
    const items = actor.items.map((item) => {
        const itemUpdate = migrateItemData(item, worldSchemaVersion);
        if (!isObjectEmpty(itemUpdate)) {
            itemsChanged = true;
            return mergeObject(item, itemUpdate, {enforceTypes: false, inplace: false});
        }
        return item;
    });
    if (itemsChanged) {
        update.items = items;
    }
    return update;
};

const migrateItemData = (item, worldSchemaVersion) => {
    const update = {};
    if (worldSchemaVersion < 1) {
        const powerType = [ "trait", "ability", "mysticalPower", "ritual", "burden", "boon" ];
        const gearType = [ "weapon", "armor", "equipment", "artifact" ];
        if (powerType.includes(item.type)) {
            update["data.bonus"] = {
                defense: 0,
                accurate: 0,
                cunning: 0,
                discreet: 0,
                persuasive: 0,
                quick: 0,
                resolute: 0,
                strong: 0,
                vigilant: 0,
                toughness: { max: 0, threshold: 0 },
                corruption: { threshold: 0 }
            }
        } else if (gearType.includes(item.type)) {
            update["data.bonus.toughness"] = { max:0, threshold: 0 };
            update["data.bonus.corruption"] = { threshold: 0 };
        }
        const boonType = [ "boon", "burden" ];
        
        if( boonType.includes(item.type) ) {
			update["level"] = 1;
		}
        if( item.type == "armor" ) {
		    update["data.defenseattribute"] = "quick";
			update["data.initative"] = {
				"primaryattribute": "quick",
				"secondaryattribute": "vigilant" };
		}
    }
    if (!isObjectEmpty(update)) {
        update._id = item._id;
    }
    return update;
};

const migrateSceneData = (scene, worldSchemaVersion) => {
    const tokens = duplicate(scene.tokens);
    return {
        tokens: tokens.map((tokenData) => {
            if (!tokenData.actorId || tokenData.actorLink || !tokenData.actorData.data) {
                tokenData.actorData = {};
                return tokenData;
            }
            const token = new Token(tokenData);
            if (!token.actor) {
                tokenData.actorId = null;
                tokenData.actorData = {};
            } else if (!tokenData.actorLink && token.data.actorData.items) {
                const update = migrateActorData(token.data.actorData, worldSchemaVersion);
                console.log("ACTOR CHANGED", token.data.actorData, update);
                tokenData.actorData = mergeObject(token.data.actorData, update);
            }
            return tokenData;
        }),
    };
};

export const migrateCompendium = async function (pack, worldSchemaVersion) {
    const entity = pack.metadata.entity;

    await pack.migrate();
    const content = await pack.getContent();

    for (let ent of content) {
        let updateData = {};
        if (entity === "Item") {
            updateData = migrateItemData(ent.data, worldSchemaVersion);
        } else if (entity === "Actor") {
            updateData = migrateActorData(ent.data, worldSchemaVersion);
        } else if (entity === "Scene") {
            updateData = migrateSceneData(ent.data, worldSchemaVersion);
        }
        if (!isObjectEmpty(updateData)) {
            expandObject(updateData);
            updateData["_id"] = ent._id;
            await pack.updateEntity(updateData);
        }
    }
};
