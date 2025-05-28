// createShapeLayer.jsx
// Creates a new shape layer in the specified composition

function createShapeLayer(args) {
    try {
        // Extract parameters from args
        var compName = args.compName || "";
        var shapeType = args.shapeType || "rectangle"; // rectangle, ellipse, polygon
        var position = args.position || [960, 540]; // Default to center
        var size = args.size || [200, 200]; // Width, Height
        var fillColor = args.fillColor || [1, 0, 0]; // Default to red
        var strokeColor = args.strokeColor || [0, 0, 0]; // Default to black
        var strokeWidth = args.strokeWidth || 0; // Default to no stroke
        var startTime = args.startTime || 0;
        var duration = args.duration || 5; // Default 5 seconds
        var name = args.name || "Shape Layer";
        var points = args.points || 5; // For polygon, number of points
        
        // Find the composition by name
        var comp = null;
        for (var i = 1; i <= app.project.numItems; i++) {
            var item = app.project.item(i);
            if (item instanceof CompItem && item.name === compName) {
                comp = item;
                break;
            }
        }
        
        // If no composition was found by name, use the active composition
        if (!comp) {
            if (app.project.activeItem instanceof CompItem) {
                comp = app.project.activeItem;
            } else {
                throw new Error("No composition found with name '" + compName + "' and no active composition");
            }
        }
        
        // Create a shape layer
        var shapeLayer = comp.layers.addShape();
        shapeLayer.name = name;
        
        // Get the root content property group
        var contents = shapeLayer.property("Contents");
        
        // Add a shape group (e.g., "Group 1")
        var shapeGroup = contents.addProperty("ADBE Vector Group");
        // Get the Contents property group WITHIN the new shape group
        var groupContents = shapeGroup.property("Contents");
        
        // Add the appropriate shape path based on type TO THE GROUP'S CONTENTS
        var shapePathProperty;
        if (shapeType === "rectangle") {
            shapePathProperty = groupContents.addProperty("ADBE Vector Shape - Rect");
            var rectSizeProp = shapePathProperty.property("Size");
            rectSizeProp.setValue(size);
        } else if (shapeType === "ellipse") {
            shapePathProperty = groupContents.addProperty("ADBE Vector Shape - Ellipse");
            var ellipseSizeProp = shapePathProperty.property("Size");
            ellipseSizeProp.setValue(size);
        } else if (shapeType === "polygon" || shapeType === "star") {
            shapePathProperty = groupContents.addProperty("ADBE Vector Shape - Star");
            shapePathProperty.property("Type").setValue(shapeType === "polygon" ? 1 : 2);
            shapePathProperty.property("Points").setValue(points);
            shapePathProperty.property("Outer Radius").setValue(size[0] / 2);
            if (shapeType === "star") {
                shapePathProperty.property("Inner Radius").setValue(size[0] / 3);
            }
        }
        
        // Add fill TO THE GROUP'S CONTENTS
        var fill = groupContents.addProperty("ADBE Vector Graphic - Fill");
        fill.property("Color").setValue(fillColor);
        fill.property("Opacity").setValue(100);
        
        // Add stroke TO THE GROUP'S CONTENTS if width > 0
        if (strokeWidth > 0) {
            var stroke = groupContents.addProperty("ADBE Vector Graphic - Stroke");
            stroke.property("Color").setValue(strokeColor);
            stroke.property("Stroke Width").setValue(strokeWidth);
            stroke.property("Opacity").setValue(100);
        }
        
        // Set layer's main transform properties
        shapeLayer.property("Position").setValue(position);
        
        // Set timing
        shapeLayer.startTime = startTime;
        if (duration > 0) {
            shapeLayer.outPoint = startTime + duration;
        }
        
        // Return success with layer details
        return JSON.stringify({
            status: "success",
            message: "Shape layer created successfully",
            layer: {
                name: shapeLayer.name,
                index: shapeLayer.index,
                type: "shape",
                shapeType: shapeType,
                inPoint: shapeLayer.inPoint,
                outPoint: shapeLayer.outPoint,
                position: shapeLayer.property("Position").value
            }
        }, null, 2);
    } catch (error) {
        // Return error message
        return JSON.stringify({
            status: "error",
            message: error.toString()
        }, null, 2);
    }
} 