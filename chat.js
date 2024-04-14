import { Loot } from "./loot.js";

const chatUrl = 'https://api.openai.com/v1/chat/completions';
const imgUrl = 'https://api.openai.com/v1/images/generations';

async function streamCompletion(chatObj, key, callback) {
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`
    };

    console.log('Start stream completion...');

    chatObj.stream = true;
    const body = JSON.stringify(chatObj);

    const response = await fetch(chatUrl, { method: 'POST', headers, body });

    if (!response.body) {
        throw new Error("No ReadableStream received");
    }

    const reader = response.body.getReader();

    while (true) {
        const { done, value } = await reader.read();

        if (done) {
            break;
        }

        if (value) {
            const chunks = new TextDecoder("utf-8").decode(value).split('\n');
            for (const chunk of chunks) {
                if (chunk.startsWith('data: ')) {
                    if (chunk === 'data: [DONE]') {
                        callback(null, '!Stream completed!');
                        break;
                    }
                    const validJson = chunk.replace('data: ', '');
                    try {
                        const chunkObj = JSON.parse(validJson);
                        const content = chunkObj.choices[0]?.delta?.content;
                        if (content) {
                            callback(null, content);
                        }
                    } catch (error) {
                        callback(error);
                    }
                }
            }
        }
    }
}

export { streamCompletion };

async function chatCompletion(chatObj, key) {
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`
    };

    console.log('Start chat completion...');

    const body = JSON.stringify(chatObj);

    return fetch(chatUrl, { method: 'POST', headers, body })
        .then(response => response.json())
        .catch(error => {
            console.error('Error:', error);
            return error;
        });
}

export { chatCompletion };

async function imageCompletion(imageObj, key) {
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`
    };

    console.log('Start image completion...');

    const body = JSON.stringify(imageObj);

    return fetch(imgUrl, { method: 'POST', headers, body })
        .then(response => response.json())
        .catch(error => {
            console.error('Error:', error);
            return error;
        });
}

export { imageCompletion };

async function imageViewUrl(imageUrl, chatObj, args, key, prev) {
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`
    };

    console.log('Start image view...');

    let prompt = prev ? `Describe the image. Be succinct. Only a few sentences at most. The previous description is as follows. Use it as a basis. Return a new version of the entire prompt: ${prev}` : 'Describe the image. Be succinct. Only a few sentences at most.';
    args ? prompt = prompt + ` The user has provided the following additional prompt: ${args}` : prompt = prompt;

    //Model override
    chatObj.model= 'gpt-4-vision-preview'
    chatObj.messages.push({
        role: 'user',
        content: [
            {
                type: 'text',
                text: prompt,
            },
            {
                type: 'image_url',
                image_url: {
                    url: imageUrl
                }
            }
        ]
    });

    const body = JSON.stringify(chatObj);


    return fetch(chatUrl, { method: 'POST', headers, body })
        .then(response => response.json())
        .catch(error => {
            console.error('Error:', error);
            return error;
        });
}

export { imageViewUrl };

async function imageViewBase64(imageFile, chatObj, input = null, key) {
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`
    };

    let imgPrompt = `You are identifying the contents of an image.`;

    if (input) {
        imgPrompt = imgPrompt + ` The user has provided the following additional prompt for the item: ${input}`;
    }

    console.log('Start image view...');

    const reader = new FileReader();

    const base64Image = await new Promise((resolve, reject) => {
        reader.onloadend = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(imageFile);
    });

    //Model override. Remove at some point
    chatObj.model= 'gpt-4-vision-preview'
    chatObj.messages.push({
        role: 'user',
        content: [
            {
                type: 'text',
                text: imgPrompt,
            },
            {
                type: 'image_url',
                image_url: {
                    url: `data:image/jpeg;base64,${base64Image}`
                }
            }
        ]
    });

    const body = JSON.stringify(chatObj);

    console.log(chatObj.messages)


    return fetch(chatUrl, { method: 'POST', headers, body })
        .then(response => response.json())
        .catch(error => {
            console.error('Error:', error);
            return error;
        });
}

export { imageViewBase64 };

async function createLoot(input, key) {
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`
    };

    console.log('Start loot creation...');
    const body = JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
            {
                role: 'system',
                content: `You are creating a loot item for a game. Provide a description of the item. Include the name of the item, a description of the item, and any special abilities or attributes it may have. The item can be anything. Your response should be in JSON format. Example:
                
                {
                    "name": "Sword of Power",
                    "nameHex": "#FF00FF",
                    "rarity": "⭐ Legendary",
                    "rarityHex": "#FF00FF",
                    "type": "⚔️ Weapon",
                    "materials": {"diamond", "gold"},
                    "description": "A sword that glows with a bright light. It is said to have been forged by the gods themselves.",
                    "attributes": {
                        "attack": "+10",
                        "defense": "+5"
                    },
                    "abilities": {
                        "smite": "Deals double damage to undead enemies."
                    }
                }
                Any details not specified by the user should be generated in your response. Not all fields are required. You can include as many or as few as you like. The more details you provide, the more interesting the item will be.
                The nameHex and rarityHex fields will default to white if not provided. The colours should be in hexadecimal format and correspond to the name and rarity of the item. Opt for a colour that matches the item's theme. Bright colours are recommended.
                The type field should include a single unicode character that represents the type of item. For example, a weapon could be represented by ⚔️, an accessory by 💍, and a potion by 🧪. Try to use unicode symbols that are widely supported. Make sure to also include the text, e.g "⚔️ Weapon", not just "Weapon" or "⚔️". 
                Name should always be first, followed by nameHex, rarity, rarityHex, type, typeIcon, materials, description, attributes, and abilities.
                Always include the name, description, rarity, type, and materials fields.
                The rarity field should include a single unicode symbol that represents the rarity of the item. For example, a rare item could be represented by a diamond 💎, and a legendary item by a star ⭐. Try to use unicode symbols that are widely supported.
                Do not return empty fields in your response. If a property is not present on the item, do not include the property at all. Example: "attributes": {} should not be included in the response. 
                `
            },
            {
                role: 'user',
                content: `User input for item creation: ` + input
            }
        ],
        response_format: { "type": "json_object" },
        temperature: 1.5,
        seed: Math.floor(Math.random() * 1000)
    });

    return fetch(chatUrl, { method: 'POST', headers, body })
        .then(response => response.json())
        .then(response => {
            const item = JSON.parse(response.choices[0].message.content);
            console.log(item);
            // return item;
            const itemElement = Loot.createLootItem(item);
            return itemElement;
        })
        .catch(error => {
            console.error('Error:', error);
            return error;
        });

}

export { createLoot };