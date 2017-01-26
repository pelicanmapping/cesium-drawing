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

    // TODO:  Make this per entity editor.
    this.draggers = [];

    this.initializeDraggerHandler();
};

CesiumDrawing.Editor.prototype.startEditing = function( entity ) {

  entity.startEditing();

  if (entity.polyline) {
    var positions = entity.polyline.positions._value;
    entity.polyline.positions.isConstant = false;
    for (var i = 0; i < positions.length; i++) {
        var loc = positions[i];
        var dragger = this.createDragger( loc, function(dragger, position) {
            dragger.positions[dragger.index] = position;
        });
        dragger.index = i;
        dragger.positions = positions;
        this.draggers.push( dragger );
    }
  }

  if (entity.polygon) {
    var positions = entity.polygon.hierarchy._value;
    entity.polygon.hierarchy.isConstant = false;
    for (var i = 0; i < positions.length; i++) {
        var loc = positions[i];
        var dragger = this.createDragger( loc, function(dragger, position) {
            dragger.positions[dragger.index] = position;
        });
        dragger.index = i;
        dragger.positions = positions;
        this.draggers.push( dragger );
    }
  }

  if (entity.ellipse) {
    // Create a dragger that just modifies the entities position.
    var dragger = this.createDragger(entity.position._value, function(dragger, newPosition) {

        var diff = new Cesium.Cartesian3();
        Cesium.Cartesian3.subtract(newPosition, entity.position._value, diff);
        entity.position._value = newPosition;


        var newPos = new Cesium.Cartesian3();
        Cesium.Cartesian3.add(dragger.radiusDragger.position._value, diff, newPos)
        dragger.radiusDragger.position = new Cesium.ConstantProperty(newPos);
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
    var radiusDragger = this.createDragger(pos, function(dragger, newPosition) {
      var radius = Cesium.Cartesian3.distance(entity.position._value, newPosition);
      entity.ellipse.semiMinorAxis = new Cesium.ConstantProperty( radius );
      entity.ellipse.semiMajorAxis = new Cesium.ConstantProperty( radius );
    });
    dragger.radiusDragger = radiusDragger;
    this.draggers.push( radiusDragger );
  }

  if (entity.corridor) {
    var positions = entity.corridor.positions._value;
    entity.corridor.positions.isConstant = false;
    for (var i = 0; i < positions.length; i++) {
        var loc = positions[i];
        var dragger = this.createDragger( loc, function(dragger, position) {
            dragger.positions[dragger.index] = position;
        });
        dragger.index = i;
        dragger.positions = positions;
        this.draggers.push( dragger );
    }
  }
};

CesiumDrawing.Editor.prototype.stopEditing = function( entity ) {
    entity.stopEditing();

    // Mark the position properties as being constant since we are done editing.
    // You will see a flash as the geometry rebuilds, but rendering performance of the static geometries will
    // be faster.
    if (entity.polyline) {
      entity.polyline.positions.isConstant = true;
    }
    else if (entity.polygon) {
      entity.polygon.hierarchy.isConstant = true;
    }

    // Get rid of all the draggers.
    for (var i = 0; i < this.draggers.length; i++) {
      this.viewer.entities.remove( this.draggers[i]);
    }

    this.draggers = [];
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
              var hit = this.viewer.camera.pickEllipsoid(movement.endPosition);
                if (hit) {
                  draggerHandler.dragger.position = hit;
                  if (draggerHandler.dragger.onDrag) {
                    draggerHandler.dragger.onDrag(draggerHandler.dragger, hit);
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
            if (draggerHandler.dragger) {
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
CesiumDrawing.Editor.prototype.createDragger = function(position, onDrag) {
   var dragger = this.viewer.entities.add({
      position : position,
      billboard :{
          image : "img/dragIcon.png"
      }
  });
  dragger._isDragger = true;
  dragger.onDrag = onDrag;
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
