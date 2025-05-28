/**
 * Sets a keyframe for a specific property on a layer.
 * @param {number} compIndex - The index of the composition (1-based for user input, converted to 0-based for ExtendScript)
 * @param {number} layerIndex - The index of the layer (1-based for user input, converted to 0-based for ExtendScript)
 * @param {string} propertyName - The name of the property to set keyframe for
 * @param {number} timeInSeconds - The time in seconds where to set the keyframe
 * @param {*} value - The value to set at the keyframe
 * @returns {string} JSON string with operation result
 */
function setLayerKeyframe(compIndex, layerIndex, propertyName, timeInSeconds, value) {
    try {
        // Adjust indices to be 0-based for ExtendScript arrays
        var comp = app.project.items[compIndex];
        if (!comp || !(comp instanceof CompItem)) {
            return JSON.stringify({ success: false, message: "Composition not found at index " + compIndex });
        }
        var layer = comp.layers[layerIndex];
        if (!layer) {
            return JSON.stringify({ success: false, message: "Layer not found at index " + layerIndex + " in composition '" + comp.name + "'"});
        }

        var transformGroup = layer.property("Transform");
        if (!transformGroup) {
             return JSON.stringify({ success: false, message: "Transform properties not found for layer '" + layer.name + "' (type: " + layer.matchName + ")." });
        }

        var property = transformGroup.property(propertyName);
        if (!property) {
             if (layer.property("Effects") && layer.property("Effects").property(propertyName)) {
                 property = layer.property("Effects").property(propertyName);
             } else if (layer.property("Text") && layer.property("Text").property(propertyName)) {
                 property = layer.property("Text").property(propertyName);
            }

            if (!property) {
                 return JSON.stringify({ success: false, message: "Property '" + propertyName + "' not found on layer '" + layer.name + "'." });
            }
        }

        if (!property.canVaryOverTime) {
             return JSON.stringify({ success: false, message: "Property '" + propertyName + "' cannot be keyframed." });
        }

        if (property.numKeys === 0 && !property.isTimeVarying) {
             property.setValueAtTime(comp.time, property.value);
        }

        property.setValueAtTime(timeInSeconds, value);

        return JSON.stringify({ 
            success: true, 
            message: "Keyframe set for '" + propertyName + "' on layer '" + layer.name + "' at " + timeInSeconds + "s.",
            details: {
                compName: comp.name,
                layerName: layer.name,
                propertyName: propertyName,
                timeInSeconds: timeInSeconds,
                value: value
            }
        });
    } catch (e) {
        return JSON.stringify({ 
            success: false, 
            message: "Error setting keyframe: " + e.toString() + " (Line: " + e.line + ")" 
        });
    }
} 