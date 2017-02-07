# cesium-drawing

Drawing and editing framework for Cesium

## Getting started

First, include the javascript files
```
<head>
  <script src="Cesium/Cesium/Cesium.js"></script>
  <script src="js/DynamicProperty.js"></script>
  <script src="js/CesiumDrawing.js"></script>
</head>
```

Create an Editor object and attach it your Viewer
```
<script>
    // Create the Viewer
    var viewer = new Cesium.Viewer('cesiumContainer');
    
    // Create the Editor and associate it with your Viewer.
    var editor = new CesiumDrawing.Editor( viewer );  
</script>
```

Creating an Entity
```
// Create the Entity with a DynamicProperty for the positions array so they can be updated dynamically.
var entity = viewer.entities.add({
  name : 'Entity',
  polyline : {
      positions: new DynamicProperty([]),
      width : 2,
      material : Cesium.Color.RED
  }
});

// Extend the Entity so that it has the events and functions for editing.
CesiumDrawing.extendEntity(entity);

// Start creating the polyline
editor.createPositionsHandler( entity, entity.polyline.positions._value );
   
```

Responding to editting events on an Entity
```
// The entity is about to be editted.
function startEdit(entity) {  
}

// The entity is finished being editted
function stopEdit(entity) {
}

// The entity was changed but the editor is still active.
function onEdit(entity) {
}

// Subscribe to the events on the entity.
entity.startEdit.addEventListener(startEdit);
entity.stopEdit.addEventListener(stopEdit);
entity.edited.addEventListener(onEdit);      
```

Start and stop editting on an Entity
```
// Start editing an Entity
editor.startEditing( entity );

// Stop eding an Entity
editor.startEditing( entity );

```



