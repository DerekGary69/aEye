export const Loot = (() => {
    const createLootItem = (item) => {
        const itemElement = document.createElement('div');
        itemElement.classList.add('item');
        const itemBg = document.createElement('div');
        itemBg.classList.add('itembg');
        itemElement.appendChild(itemBg);
        for (const key in item) {
            if (key === 'nameHex' || key === 'rarityHex') {
                continue;
            }
            const displayKey = key.replace(/_/g, ' ');
            if (Array.isArray(item[key])) {
                const detailsElement = document.createElement('details');
                detailsElement.classList.add(key);
                const summary = document.createElement('summary');
                summary.textContent = displayKey.charAt(0).toUpperCase() + displayKey.slice(1) + ':';
                detailsElement.appendChild(summary);
                for (const value of item[key]) {
                    const pElement = document.createElement('p');
                    pElement.classList.add(`${key}-value`);
                    let ucaseValue = value.charAt(0).toUpperCase() + value.slice(1);
                    pElement.textContent = ucaseValue;
                    detailsElement.appendChild(pElement);
                }
                itemElement.appendChild(detailsElement);
            } else if (typeof item[key] === 'object') {
                const detailsElement = document.createElement('details');
                detailsElement.classList.add(key);
                const summary = document.createElement('summary');
                summary.textContent = displayKey.charAt(0).toUpperCase() + displayKey.slice(1) + ':';
                detailsElement.appendChild(summary);
                for (const [name, description] of Object.entries(item[key])) {
                    const pElement = document.createElement('p');
                    pElement.classList.add(`${key}-name`);
                    let displayName = name.replace(/_/g, ' ');
                    pElement.innerHTML = `<strong>${displayName.charAt(0).toUpperCase() + displayName.slice(1)}:</strong> `;
                
                    const spanElement = document.createElement('span');
                    spanElement.classList.add(`${key}-description`);
                
                    if (typeof description === 'object') {
                        for (const [subName, subDescription] of Object.entries(description)) {
                            let displaySubName = subName.replace(/_/g, ' ');
                            spanElement.textContent += `${displaySubName.charAt(0).toUpperCase() + displaySubName.slice(1)}: ${subDescription} `;
                        }
                    } else {
                        spanElement.textContent = `${description}`;
                    }
                
                    // let br = document.createElement('br');
                    // pElement.appendChild(br);
                    pElement.appendChild(spanElement);
                
                    detailsElement.appendChild(pElement);
                }
                itemElement.appendChild(detailsElement);
            } else {
                const pElement = document.createElement('p');
                pElement.classList.add(key);
                let value = item[key];
                value = value.charAt(0).toUpperCase() + value.slice(1);
                // pElement.innerHTML = `<strong>` + displayKey.charAt(0).toUpperCase() + displayKey.slice(1) + ':</strong> <span>' + value + '</span>';
                pElement.innerHTML = `<span>` + value + `</span>`;

                const spanElement = pElement.querySelector('span');
                if (key === 'name' && item.nameHex) {
                    spanElement.style.color = item.nameHex;
                    spanElement.style.textShadow = `0 0 5px ${invertColor(item.nameHex)}`;
                }
                if (key === 'rarity' && item.rarityHex) {
                    spanElement.style.color = item.rarityHex;
                    spanElement.style.textShadow = `0 0 5px ${invertColor(item.rarityHex)}`;
                }
                if(item.rarityHex) {
                    itemBg.style.boxShadow = `inset 0 0 0.5rem ${item.rarityHex}`;
                }
                itemElement.appendChild(pElement);
            }
        }
        return itemElement;
    };

    return {
        createLootItem
    };
})();

// Usage:
// const itemElement = Loot.createLootItem(item);
// document.body.appendChild(itemElement);

function invertColor(hex) {
    let color = (hex.charAt(0) === '#') ? hex.substring(1, 7) : hex;
    color = parseInt(color, 16);
    color = 0xFFFFFF ^ color;  // invert color
    color = color.toString(16);
    color = ("000000" + color).slice(-6);  // pad with leading zeros
    return '#' + color;
}