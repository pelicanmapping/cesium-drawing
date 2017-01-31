CesiumDrawing = {};

/**
 * Extends an entity with events and functions to enable editing.
 */
CesiumDrawing.extendEntity = function(entity) {
    entity.startEdit = new Cesium.Event();
    entity.stopEdit = new Cesium.Event();

    entity.startEditing = function() {
      entity.startEdit.raiseEvent(entity);
    };

    entity.stopEditing = function() {
      entity.stopEdit.raiseEvent(entity);
    };
};

/**
 * Create a new editor that manages overall drawing and editing capabilities for a Viewer.
 */
CesiumDrawing.Editor = function(viewer) {
    this.viewer = viewer;
    this.initializeDraggerHandler();
};

CesiumDrawing.Editor.prototype.startEditing = function( entity ) {

  entity.startEditing();

  if (entity.polyline) {
    entity.editor = new CesiumDrawing.PolylineEditor(this, entity);
  }

  if (entity.polygon) {
    if (entity.polygon.extrudedHeight)
    {
      entity.editor = new CesiumDrawing.ExtrudedPolygonEditor(this, entity);
    }
    else
    {
      entity.editor = new CesiumDrawing.PolygonEditor(this, entity);
    }
  }

  if (entity.ellipse) {
    entity.editor = new CesiumDrawing.EllipseEditor(this, entity);
  }

  if (entity.corridor) {
    entity.editor = new CesiumDrawing.CorridorEditor(this, entity);
  }
};

CesiumDrawing.Editor.prototype.stopEditing = function( entity ) {
    entity.stopEditing();

    if (entity.editor) {
      entity.editor.destroy();
      entity.editor = null;
    }

    // Mark the position properties as being constant since we are done editing.
    // You will see a flash as the geometry rebuilds, but rendering performance of the static geometries will
    // be faster.
    if (entity.polyline) {
      entity.polyline.positions.isConstant = true;
    }
    else if (entity.polygon) {
      entity.polygon.hierarchy.isConstant = true;
    }
    else if (entity.corridor) {
      entity.corridor.positions.isConstant = true;
    }
};


/**
 * Initialize the utility handler that will assist in selecting and manipulating Dragger billboards.
 */
CesiumDrawing.Editor.prototype.initializeDraggerHandler = function() {

    // Create the handler.
    var draggerHandler = new Cesium.ScreenSpaceEventHandler(this.viewer.canvas);

    // Initialize the active dragger to null;
    draggerHandler.dragger = null;

    // Left down selects a dragger
    draggerHandler.setInputAction(
        function(click) {
            var pickedObject = this.viewer.scene.pick(click.position);
            if (Cesium.defined(pickedObject)) {
                var entity = pickedObject.id;
                if (Cesium.defaultValue(entity._isDragger, false)) {
                  // Resize the dragger.
                  entity.billboard.scale = 1.2;
                  draggerHandler.dragger = entity;
                  this.viewer.scene.screenSpaceCameraController.enableRotate = false;
                  this.viewer.scene.screenSpaceCameraController.enableTilt = false;
                  this.viewer.scene.screenSpaceCameraController.enableTranslate = false;
                }
            }
        },
        Cesium.ScreenSpaceEventType.LEFT_DOWN
    );

        // Left down selects a dragger
    draggerHandler.setInputAction(
        function(click) {
            var pickedObject = this.viewer.scene.pick(click.position);
            if (Cesium.defined(pickedObject)) {
                var entity = pickedObject.id;
                if (Cesium.defaultValue(entity._isDragger, false)) {
                  // Resize the dragger.
                  entity.billboard.scale = 1.2;
                  draggerHandler.dragger = entity;
                  this.viewer.scene.screenSpaceCameraController.enableRotate = false;
                  this.viewer.scene.screenSpaceCameraController.enableTilt = false;
                  this.viewer.scene.screenSpaceCameraController.enableTranslate = false;
                }
            }
        },
        Cesium.ScreenSpaceEventType.LEFT_DOWN,
        Cesium.KeyboardEventModifier.CTRL
    );

    // Mouse move drags the draggers and calls their onDrag callback.
    draggerHandler.setInputAction(
        function(movement) {
            if (draggerHandler.dragger) {

              if (draggerHandler.dragger.horizontal) {
              var hit = this.viewer.camera.pickEllipsoid(movement.endPosition);
                if (hit) {
                  draggerHandler.dragger.position = hit;
                  if (draggerHandler.dragger.onDrag) {
                    draggerHandler.dragger.onDrag(draggerHandler.dragger, hit);
                  }
                }
              }

              if (draggerHandler.dragger.vertical) {
                var dy = movement.endPosition.y - movement.startPosition.y;
                var position = draggerHandler.dragger.position._value;
                var tangentPlane = new Cesium.EllipsoidTangentPlane( position );

                scratchBoundingSphere.center = position;
                scratchBoundingSphere.radius = 1;

                var metersPerPixel = viewer.scene.frameState.camera.getPixelSize(scratchBoundingSphere,
                                                                                 viewer.scene.frameState.context.drawingBufferWidth,
                                                                                 viewer.scene.frameState.context.drawingBufferHeight);

                var zOffset = new Cesium.Cartesian3();

                Cesium.Cartesian3.multiplyByScalar(tangentPlane.zAxis, -dy * metersPerPixel, zOffset);
                var newPosition = Cesium.Cartesian3.clone(position);
                Cesium.Cartesian3.add(position, zOffset, newPosition);

                draggerHandler.dragger.position = newPosition;
                if (draggerHandler.dragger.onDrag) {
                    draggerHandler.dragger.onDrag(draggerHandler.dragger, newPosition);
                }
              }
            }
        },
        Cesium.ScreenSpaceEventType.MOUSE_MOVE
    );

    var scratchBoundingSphere = new Cesium.BoundingSphere();

    // Mouse move drags the draggers and calls their onDrag callback.
    draggerHandler.setInputAction(
        function(movement) {
            if (draggerHandler.dragger && draggerHandler.dragger.verticalCtrl) {
                var dy = movement.endPosition.y - movement.startPosition.y;
                var position = draggerHandler.dragger.position._value;
                var tangentPlane = new Cesium.EllipsoidTangentPlane( position );

                scratchBoundingSphere.center = position;
                scratchBoundingSphere.radius = 1;

                var metersPerPixel = viewer.scene.frameState.camera.getPixelSize(scratchBoundingSphere,
                                                                                 viewer.scene.frameState.context.drawingBufferWidth,
                                                                                 viewer.scene.frameState.context.drawingBufferHeight);

                var zOffset = new Cesium.Cartesian3();

                Cesium.Cartesian3.multiplyByScalar(tangentPlane.zAxis, -dy * metersPerPixel, zOffset);
                var newPosition = Cesium.Cartesian3.clone(position);
                Cesium.Cartesian3.add(position, zOffset, newPosition);

                draggerHandler.dragger.position = newPosition;
                if (draggerHandler.dragger.onDrag) {
                    draggerHandler.dragger.onDrag(draggerHandler.dragger, newPosition);
                }
            }
        },
        Cesium.ScreenSpaceEventType.MOUSE_MOVE,
        Cesium.KeyboardEventModifier.CTRL
    );


    // Left up stops dragging.
    draggerHandler.setInputAction(
        function() {
            if (draggerHandler.dragger) {
              draggerHandler.dragger.billboard.scale = 1;
              draggerHandler.dragger = null;
              this.viewer.scene.screenSpaceCameraController.enableRotate = true;
              this.viewer.scene.screenSpaceCameraController.enableTilt = true;
              this.viewer.scene.screenSpaceCameraController.enableTranslate = true;
            }
        },
        Cesium.ScreenSpaceEventType.LEFT_UP
    );

    // Left up stops dragging.
    draggerHandler.setInputAction(
        function() {
            if (draggerHandler.dragger) {
              draggerHandler.dragger.billboard.scale = 1;
              draggerHandler.dragger = null;
              this.viewer.scene.screenSpaceCameraController.enableRotate = true;
              this.viewer.scene.screenSpaceCameraController.enableTilt = true;
              this.viewer.scene.screenSpaceCameraController.enableTranslate = true;
            }
        },
        Cesium.ScreenSpaceEventType.LEFT_UP,
        Cesium.KeyboardEventModifier.CTRL
    );

    this.draggerHandler = draggerHandler;
};

/**
 * Creates a Dragger
 */
CesiumDrawing.Editor.prototype.createDragger = function(options) {

   var position = Cesium.defaultValue(options.position, Cesium.Cartesian3.ZERO);
   var onDrag = Cesium.defaultValue(options.onDrag, null);
   var icon = Cesium.defaultValue(options.icon, "img/dragIcon.png");

   var dragger = this.viewer.entities.add({
      position : position,
      billboard :{
          image : icon
      }
  });
  dragger._isDragger = true;
  dragger.onDrag = onDrag;
  dragger.horizontal = Cesium.defaultValue(options.horizontal, true);
  dragger.vertical = Cesium.defaultValue(options.vertical, false);
  dragger.verticalCtrl = Cesium.defaultValue(options.vertical, false);

  return dragger;
};

/**
 * Creates a handler that lets you modify a list of positions.
 */
CesiumDrawing.Editor.prototype.createPositionsHandler = function(entity, positions) {
  var handler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);

  // Adds a point to the positions list.
  handler.lastPointTemporary = false;
  handler.setInputAction(function(movement) {
      var cartesian = viewer.camera.pickEllipsoid(movement.position, this.viewer.scene.globe.ellipsoid);
      if (cartesian) {
        if (handler.lastPointTemporary)
        {
            positions.pop();
        }
        var index = positions.length;
        positions.push( cartesian );
        handler.lastPointTemporary = false;
      }
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

  // Replaces the last point in the list with the point under the mouse.
  handler.setInputAction(function(movement) {
    if (movement.endPosition) {
        var cartesian = this.viewer.camera.pickEllipsoid(movement.endPosition, this.viewer.scene.globe.ellipsoid);
        if (cartesian) {
          if (handler.lastPointTemporary)
          {
            positions.pop();
          }
          positions.push( cartesian );
          handler.lastPointTemporary = true;
        }
      }
  }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

  handler.setInputAction(function(movement) {
      entity.inProgress = false;
      handler.destroy();
  }, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);

  return handler;
};



/**
 * An editor that allows you to edit a polyline.
 */
CesiumDrawing.PolylineEditor = function(editor, entity) {
  this.editor = editor;
  this.entity = entity;
  this.draggers = [];

  var positions = entity.polyline.positions._value;
  entity.polyline.positions.isConstant = false;
  for (var i = 0; i < positions.length; i++) {
      var loc = positions[i];
      var dragger = editor.createDragger({
        position: loc,
        onDrag: function(dragger, position) {
          dragger.positions[dragger.index] = position;
        }
      });
      dragger.index = i;
      dragger.positions = positions;
      this.draggers.push( dragger );
  }
};

CesiumDrawing.PolylineEditor.prototype.destroy = function() {
  for (var i = 0; i < this.draggers.length; i++) {
    this.editor.viewer.entities.remove( this.draggers[i]);
  }
  this.draggers = [];
};

/**
 * An editor that allows you to edit an ellipse
 */
CesiumDrawing.EllipseEditor = function(editor, entity) {

  this.editor = editor;
  this.entity = entity;
  this.draggers = [];

  // Create a dragger that just modifies the entities position.
  var dragger = this.editor.createDragger({
    position: entity.position._value,
    onDrag: function(dragger, newPosition) {

      var diff = new Cesium.Cartesian3();
      Cesium.Cartesian3.subtract(newPosition, entity.position._value, diff);
      entity.position._value = newPosition;

      var newPos = new Cesium.Cartesian3();
      Cesium.Cartesian3.add(dragger.radiusDragger.position._value, diff, newPos)
      dragger.radiusDragger.position = new Cesium.ConstantProperty(newPos);
    }
  });
  this.draggers.push( dragger );

  var cep = Cesium.EllipseGeometryLibrary.computeEllipsePositions({
    center: entity.position._value,
    semiMinorAxis: entity.ellipse.semiMinorAxis._value,
    semiMajorAxis: entity.ellipse.semiMajorAxis._value,
    rotation: 0.0,
    granularity: 2.0
  }, true, false);
  var pos = new Cesium.Cartesian3(cep.positions[0], cep.positions[1], cep.positions[2]);

  var radiusDragger = this.editor.createDragger({
    position: pos,
    onDrag: function(dragger, newPosition) {
      var radius = Cesium.Cartesian3.distance(entity.position._value, newPosition);
      entity.ellipse.semiMinorAxis = new Cesium.ConstantProperty( radius );
      entity.ellipse.semiMajorAxis = new Cesium.ConstantProperty( radius );
    }
  });
  dragger.radiusDragger = radiusDragger;
  this.draggers.push( radiusDragger );
};


CesiumDrawing.EllipseEditor.prototype.destroy = function() {
  for (var i = 0; i < this.draggers.length; i++) {
    this.editor.viewer.entities.remove( this.draggers[i]);
  }
  this.draggers = [];
};


/**
 * Polygon editor.
 */
CesiumDrawing.PolygonEditor = function(editor, entity) {
  this.editor = editor;
  this.entity = entity;
  this.draggers = [];

  var positions = entity.polygon.hierarchy._value;
  entity.polygon.hierarchy.isConstant = false;
  for (var i = 0; i < positions.length; i++) {
      var loc = positions[i];
      var dragger = editor.createDragger({
        position: loc,
        onDrag: function(dragger, position) {
          dragger.positions[dragger.index] = position;
        }
      });
      dragger.index = i;
      dragger.positions = positions;
      this.draggers.push( dragger );
  }
};

CesiumDrawing.PolygonEditor.prototype.destroy = function() {
  for (var i = 0; i < this.draggers.length; i++) {
    this.editor.viewer.entities.remove( this.draggers[i]);
  }
  this.draggers = [];
};


/**
 * ExtrudedPolygon editor.
 */
CesiumDrawing.ExtrudedPolygonEditor = function(editor, entity) {
  this.editor = editor;
  this.entity = entity;
  this.draggers = [];
  this.heightDraggers = [];

  var that = this;

  var i = 0;

  var positions = entity.polygon.hierarchy._value;
  entity.polygon.hierarchy.isConstant = false;
  for (i = 0; i < positions.length; i++) {
      var loc = positions[i];
      var dragger = editor.createDragger({
        position: loc,
        onDrag: function(dragger, position) {
          dragger.positions[dragger.index] = position;
          that.updateDraggers();
        }
      });
      dragger.index = i;
      dragger.positions = positions;
      this.draggers.push( dragger );
  }

  // Add a dragger that will change the extruded height on the polygon.
  if (entity.polygon.extrudedHeight) {

    for (i = 0; i < positions.length; i++) {
      var position = positions[i];
      var carto = Cesium.Cartographic.fromCartesian( position );
      carto.height += entity.polygon.extrudedHeight._value;

      var loc = Cesium.Cartesian3.fromRadians( carto.longitude, carto.latitude, carto.height);

      var dragger = this.editor.createDragger({
        position: loc,
        onDrag: function(dragger, position) {
          var cartoLoc = Cesium.Cartographic.fromCartesian( position );
          entity.polygon.extrudedHeight = new Cesium.ConstantProperty(cartoLoc.height);
          that.updateDraggers();
        },
        vertical: true,
        horizontal: false
      });
      dragger.index = i;
      this.heightDraggers.push(dragger);
    }
  }
};

CesiumDrawing.ExtrudedPolygonEditor.prototype.updateDraggers = function() {
  var positions = this.entity.polygon.hierarchy._value;

  var height = this.entity.polygon.extrudedHeight._value;

  for (var i = 0; i < this.heightDraggers.length; i++) {
      var position = positions[i];
      var dragger = this.heightDraggers[i];

      var carto = Cesium.Cartographic.fromCartesian( position );
      carto.height += height;

      var loc = Cesium.Cartesian3.fromRadians( carto.longitude, carto.latitude, carto.height);

      dragger.position = loc;
    }

};



CesiumDrawing.ExtrudedPolygonEditor.prototype.destroy = function() {
  var i = 0;

  for (i = 0; i < this.draggers.length; i++) {
    this.editor.viewer.entities.remove( this.draggers[i]);
  }
  this.draggers = [];

  for (i = 0; i < this.heightDraggers.length; i++) {
    this.editor.viewer.entities.remove( this.heightDraggers[i]);
  }
  this.heightDraggers = [];
};



/**
 * Cooridor editor
 */
CesiumDrawing.CorridorEditor = function(editor, entity) {
  this.editor = editor;
  this.entity = entity;
  this.draggers = [];

  var positions = entity.corridor.positions._value;
  entity.corridor.positions.isConstant = false;
  for (var i = 0; i < positions.length; i++) {
      var loc = positions[i];
      var dragger = editor.createDragger({
        position: loc,
        onDrag: function(dragger, position) {
          dragger.positions[dragger.index] = position;
        }
      });
      dragger.index = i;
      dragger.positions = positions;
      this.draggers.push( dragger );
  }
};

CesiumDrawing.CorridorEditor.prototype.destroy = function() {
  for (var i = 0; i < this.draggers.length; i++) {
    this.editor.viewer.entities.remove( this.draggers[i]);
  }
  this.draggers = [];
};



