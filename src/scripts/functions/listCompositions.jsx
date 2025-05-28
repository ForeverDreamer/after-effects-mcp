// listCompositions.jsx
// Lists all compositions in the project

function listCompositions() {
    var project = app.project;
    var result = {
        compositions: []
    };
    
    for (var i = 1; i <= project.numItems; i++) {
        var item = project.item(i);
        
        if (item instanceof CompItem) {
            result.compositions.push({
                id: item.id,
                name: item.name,
                duration: item.duration,
                frameRate: item.frameRate,
                width: item.width,
                height: item.height,
                numLayers: item.numLayers
            });
        }
    }
    
    return JSON.stringify(result, null, 2);
} 