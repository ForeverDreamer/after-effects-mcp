/**
 * Sets an expression for a specific property on a layer.
 * @param {number} compIndex - The index of the composition (1-based for user input, converted to 0-based for ExtendScript)
 * @param {number} layerIndex - The index of the layer (1-based for user input, converted to 0-based for ExtendScript)  
 * @param {string} propertyName - The name of the property to set expression for
 * @param {string} expressionString - The expression string to apply (empty string to remove expression)
 * @returns {string} JSON string with operation result
 */
function setLayerExpression(compIndex, layerIndex, propertyName, expressionString) {
    try {
         var comp = app.project.items[compIndex];
         if (!comp || !(comp instanceof CompItem)) {
            return JSON.stringify({ success: false, message: "Composition not found at index " + compIndex });
        }
        var layer = comp.layers[layerIndex];
         if (!layer) {
            return JSON.stringify({ success: false, message: "Layer not found at index " + layerIndex + " in composition '" + comp.name + "'"});
        }

        var transformGroup = layer.property("Transform");

        var property = transformGroup ? transformGroup.property(propertyName) : null;
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

        if (!property.canSetExpression) {
            return JSON.stringify({ success: false, message: "Property '" + propertyName + "' does not support expressions." });
        }

        property.expression = expressionString;

        var action = expressionString === "" ? "removed" : "set";
        return JSON.stringify({ 
            success: true, 
            message: "Expression " + action + " for '" + propertyName + "' on layer '" + layer.name + "'.",
            details: {
                compName: comp.name,
                layerName: layer.name,
                propertyName: propertyName,
                expressionString: expressionString,
                action: action
            }
        });
    } catch (e) {
        return JSON.stringify({ 
            success: false, 
            message: "Error setting expression: " + e.toString() + " (Line: " + e.line + ")" 
        });
    }
} 