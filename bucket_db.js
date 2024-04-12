import { system, world } from "@minecraft/server";

/**
 * Copyright GabrielBrDeveloper © 2024
 * https://github.com/GabrielBRDeveloper/Bedrock-Toolkits
 */

const cached = [];

class Cache {
    id;
    data;

    constructor(id, data) {
        this.id = id;
        this.data = data;
    }
}

system.runInterval(()=>{
    while(cached.length > 0) {
        const cache = cached[cached.length-1];
        const json = JSON.stringify(cache.data);
        world.setDynamicProperty(cache.id, json);

        cached.pop();
    }
});

function loadObject(value, handler) {
    if(typeof value == "object") {
        if("__proxy__" in value) {
            value = value["__raw__"];
        }
        value = new Proxy(value, handler)
        Object.keys(value).forEach((key)=>{
            value[key] = loadObject(value[key], handler);
        });
    }
    return value;
}

export class BucketObject {
    static setup(name, template={}) {
        name = name + ".db";
        const db = JSON.parse(world.getDynamicProperty(name) ?? JSON.stringify(template));
        const cache = new Cache(name, db);
        
        const handler = {
            set(target, prop, value) {
                if(typeof value == "object") {
                    value = loadObject(value, handler);
                }
                target[prop] = value;
                if(cached.indexOf(cache) == -1)
                    cached.push(cache);

                return true;
            },

            get(target, prop) {
                if(prop == "__raw__") {
                    return target;
                } else if(prop == "__proxy__") {
                    return true;
                }
                return target[prop];
            },

            has(target, prop) {
                if(prop == "__proxy__")
                    return true;
                return prop in target;
            }
        };

        return loadObject(db, handler);
    }
}
