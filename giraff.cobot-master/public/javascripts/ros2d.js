/**
 * @fileOverview
 * @author Russell Toris - rctoris@wpi.edu
 */

var ROS2D = ROS2D || {
    /**
     * @default
     * @description Library version
     */
    REVISION : '0.10.0'
  };
  


// ##########################################  VIEWER  ###############################################

/**
 * A Viewer can be used to render an interactive 2D scene to a HTML5 canvas.
 *
 * @constructor
 * @param options - object with following keys:
 *   * divID - the ID of the div to place the viewer in
 *   * width - the initial width, in pixels, of the canvas
 *   * height - the initial height, in pixels, of the canvas
 *   * background (optional) - the color to render the background, like '#efefef'
 */
ROS2D.Viewer = function(options) {
    var that = this;
    options = options || {};
    var divID = options.divID;
    this.width = options.width;
    this.height = options.height;
    var background = options.background || '#777777';
  
    // create the canvas to render to
    var canvas = document.createElement('canvas');
    canvas.width = this.width;
    canvas.height = this.height;
    canvas.style.background = background;
    document.getElementById(divID).appendChild(canvas);
    // create the easel to use
    this.scene = new createjs.Stage(canvas);
  
    // change Y axis center
    this.scene.y = this.height;
  
    // add the renderer to the page
    document.getElementById(divID).appendChild(canvas);
  
    // update at 30fps
    createjs.Ticker.framerate = 30;
    createjs.Ticker.addEventListener('tick', this.scene);
  };
  
  /**
   * Add the given createjs object to the global scene in the viewer.
   *
   * @param object - the object to add
   */
  ROS2D.Viewer.prototype.addObject = function(object) {
    this.scene.addChild(object);
  };
  
  /**
   * Scale the scene to fit the given width and height into the current canvas.
   *
   * @param width - the width to scale to in meters
   * @param height - the height to scale to in meters
   */
  ROS2D.Viewer.prototype.scaleToDimensions = function(width, height) {
    // restore to values before shifting, if ocurred
    this.scene.x = typeof this.scene.x_prev_shift !== 'undefined' ? this.scene.x_prev_shift : this.scene.x;
    this.scene.y = typeof this.scene.y_prev_shift !== 'undefined' ? this.scene.y_prev_shift : this.scene.y;
  
    // save scene scaling
    this.scene.scaleX = this.width / width;
    this.scene.scaleY = this.height / height;
  };
  
  /**
   * Shift the main view of the canvas by the given amount. This is based on the
   * ROS coordinate system. That is, Y is opposite that of a traditional canvas.
   *
   * @param x - the amount to shift by in the x direction in meters
   * @param y - the amount to shift by in the y direction in meters
   */
  ROS2D.Viewer.prototype.shift = function(x, y) {
    // save current offset
    this.scene.x_prev_shift = this.scene.x;
    this.scene.y_prev_shift = this.scene.y;
  
    // shift scene by scaling the desired offset
    this.scene.x -= (x * this.scene.scaleX);
    this.scene.y += (y * this.scene.scaleY);
  };

  // ##########################################  IMAGE MAP CLIENT  ###############################################

    /**
 * A image map is a PNG image scaled to fit to the dimensions of a OccupancyGrid.
 *
 * Emits the following events:
 *   * 'change' - there was an update or change in the map
 *
 * @constructor
 * @param options - object with following keys:
 *   * ros - the ROSLIB.Ros connection handle
 *   * topic (optional) - the map meta data topic to listen to
 *   * image - the image URL to load
 *   * rootObject (optional) - the root object to add this marker to
 */
ROS2D.ImageMapClient = function(options) {
    EventEmitter2.call(this);
    options = options || {};
    var ros = options.ros;
    var topic = options.topic || '/map';
    this.image = options.image;
    this.rootObject = options.rootObject || new createjs.Container();
  
    // create an empty shape to start with
    this.currentImage = new createjs.Shape();
  
    // subscribe to the topic
    var rosTopic = new ROSLIB.Topic({
      ros : ros,
      name : topic,
      messageType : 'nav_msgs/msg/OccupancyGrid'                        // #### MODIFICATO
    });
  
    rosTopic.subscribe(function(message) {
      // we only need this once
      rosTopic.unsubscribe();
  
      // create the image
      this.currentImage = new ROS2D.ImageMap({
        message : message,
        image : this.image
      });
      this.rootObject.addChild(this.currentImage);
  
      this.emit('change');
    }.bind(this));
  };
  ROS2D.ImageMapClient.prototype.__proto__ = EventEmitter2.prototype;

  // #######################################################################################################################
  // #######################################  OCCUPANCY GRID CLIENT  ###############################################

/**
 * A map that listens to a given occupancy grid topic.
 *
 * Emits the following events:
 *   * 'change' - there was an update or change in the map
 *
 * @constructor
 * @param options - object with following keys:
 *   * ros - the ROSLIB.Ros connection handle
 *   * topic (optional) - the map topic to listen to
 *   * rootObject (optional) - the root object to add this marker to
 *   * continuous (optional) - if the map should be continuously loaded (e.g., for SLAM)
 */
ROS2D.OccupancyGridClient = function(options) {
    var that = this;
    options = options || {};
    var ros = options.ros;
    var topic = options.topic || '/map';
    this.continuous = options.continuous;
    this.rootObject = options.rootObject || new createjs.Container();
  
    // current grid that is displayed
    // create an empty shape to start with, so that the order remains correct.
    this.currentGrid = new createjs.Shape();
    this.rootObject.addChild(this.currentGrid);
    // work-around for a bug in easeljs -- needs a second object to render correctly
    this.rootObject.addChild(new ROS2D.Grid({size:1}));
  
    // subscribe to the topic
    var rosTopic = new ROSLIB.Topic({
      ros : ros,
      name : topic,
      messageType : 'nav_msgs/msg/OccupancyGrid',                          // #### MODIFICATO
      compression : 'pmg'
    });
  
    rosTopic.subscribe(function(message) {
      // check for an old map
      var index = null;
      if (that.currentGrid) {
        index = that.rootObject.getChildIndex(that.currentGrid);
        that.rootObject.removeChild(that.currentGrid);
      }
  
      that.currentGrid = new ROS2D.OccupancyGrid({
        message : message
      });
      if (index !== null) {
        that.rootObject.addChildAt(that.currentGrid, index);
      }
      else {
        that.rootObject.addChild(that.currentGrid);
      }
  
      that.emit('change');
  
      // check if we should unsubscribe
      if (!that.continuous) {
        rosTopic.unsubscribe();
      }
    });
  };
  ROS2D.OccupancyGridClient.prototype.__proto__ = EventEmitter2.prototype;

// #######################################################################################################################
  // ##########################################  NAVIGATION ARROW ###############################################

  /**
 * @fileOverview
 * @author Russell Toris - rctoris@wpi.edu
 */

/**
 * A navigation arrow is a directed triangle that can be used to display orientation.
 *
 * @constructor
 * @param options - object with following keys:
 *   * size (optional) - the size of the marker
 *   * strokeSize (optional) - the size of the outline
 *   * strokeColor (optional) - the createjs color for the stroke
 *   * fillColor (optional) - the createjs color for the fill
 *   * pulse (optional) - if the marker should "pulse" over time
 */
ROS2D.NavigationArrow = function(options) {
    var that = this;
    options = options || {};
    var size = options.size || 10;
    var strokeSize = options.strokeSize || 3;
    var strokeColor = options.strokeColor || createjs.Graphics.getRGB(0, 0, 0);
    var fillColor = options.fillColor || createjs.Graphics.getRGB(255, 0, 0);
    var pulse = options.pulse;
  
    // draw the arrow
    var graphics = new createjs.Graphics();
    // line width
    graphics.setStrokeStyle(strokeSize);
    graphics.moveTo(-size / 2.0, -size / 2.0);
    graphics.beginStroke(strokeColor);
    graphics.beginFill(fillColor);
    graphics.lineTo(size, 0);
    graphics.lineTo(-size / 2.0, size / 2.0);
    graphics.closePath();
    graphics.endFill();
    graphics.endStroke();
  
    // create the shape
    createjs.Shape.call(this, graphics);
  
    // check if we are pulsing
    if (pulse) {
      // have the model "pulse"
      var growCount = 0;
      var growing = true;
      createjs.Ticker.addEventListener('tick', function() {
        if (growing) {
          that.scaleX *= 1.035;
          that.scaleY *= 1.035;
          growing = (++growCount < 10);
        } else {
          that.scaleX /= 1.035;
          that.scaleY /= 1.035;
          growing = (--growCount < 0);
        }
      });
    }
  };
  ROS2D.NavigationArrow.prototype.__proto__ = createjs.Shape.prototype;

  // ######################################################################################################
  // ##########################################  PATH SHAPE ###############################################


/**
 * A shape to draw a nav_msgs/Path msg
 *
 * @constructor
 * @param options - object with following keys:
 *   * path (optional) - the initial path to draw
 *   * strokeSize (optional) - the size of the outline
 *   * strokeColor (optional) - the createjs color for the stroke
 */
ROS2D.PathShape = function(options) {
	options = options || {};
	var path = options.path;
	this.strokeSize = options.strokeSize || 3;
	this.strokeColor = options.strokeColor || createjs.Graphics.getRGB(0, 0, 0);

	// draw the line
	this.graphics = new createjs.Graphics();

	if (path !== null && typeof path !== 'undefined') {
		this.graphics.setStrokeStyle(this.strokeSize);
		this.graphics.beginStroke(this.strokeColor);
		this.graphics.moveTo(path.poses[0].pose.position.x / this.scaleX, path.poses[0].pose.position.y / -this.scaleY);
		for (var i=1; i<path.poses.length; ++i) {
			this.graphics.lineTo(path.poses[i].pose.position.x / this.scaleX, path.poses[i].pose.position.y / -this.scaleY);
		}
		this.graphics.endStroke();
	}

	// create the shape
	createjs.Shape.call(this, this.graphics);
};

/**
 * Set the path to draw
 *
 * @param path of type nav_msgs/Path
 */
ROS2D.PathShape.prototype.setPath = function(path) {
	this.graphics.clear();
	if (path !== null && typeof path !== 'undefined') {
		this.graphics.setStrokeStyle(this.strokeSize);
		this.graphics.beginStroke(this.strokeColor);
		this.graphics.moveTo(path.poses[0].pose.position.x / this.scaleX, path.poses[0].pose.position.y / -this.scaleY);
		for (var i=1; i<path.poses.length; ++i) {
			this.graphics.lineTo(path.poses[i].pose.position.x / this.scaleX, path.poses[i].pose.position.y / -this.scaleY);
		}
		this.graphics.endStroke();
	}
};

ROS2D.PathShape.prototype.__proto__ = createjs.Shape.prototype;


  // ######################################################################################################
  // ##########################################  GRID ###############################################


/**
 * A Grid object draw in map.
 *
 * @constructor
 * @param options - object with following keys:
 *  * size (optional) - the size of the grid
 *  * cellSize (optional) - the cell size of map
 *  * lineWidth (optional) - the width of the lines in the grid
 */
ROS2D.Grid = function(options) {
  var that = this;
  options = options || {};
  var size = options.size || 10;
  var cellSize = options.cellSize || 0.1;
  var lineWidth = options.lineWidth || 0.001;
  // draw the arrow
  var graphics = new createjs.Graphics();
  // line width
  graphics.setStrokeStyle(lineWidth*5);
  graphics.beginStroke(createjs.Graphics.getRGB(0, 0, 0));
  graphics.beginFill(createjs.Graphics.getRGB(255, 0, 0));
  graphics.moveTo(-size*cellSize, 0);
  graphics.lineTo(size*cellSize, 0);
  graphics.moveTo(0, -size*cellSize);
  graphics.lineTo(0, size*cellSize);
  graphics.endFill();
  graphics.endStroke();

  graphics.setStrokeStyle(lineWidth);
  graphics.beginStroke(createjs.Graphics.getRGB(0, 0, 0));
  graphics.beginFill(createjs.Graphics.getRGB(255, 0, 0));
  for (var i = -size; i <= size; i++) {
      graphics.moveTo(-size*cellSize, i * cellSize);
      graphics.lineTo(size*cellSize, i * cellSize);
      graphics.moveTo(i * cellSize, -size*cellSize);
      graphics.lineTo(i * cellSize, size*cellSize);
  }
  graphics.endFill();
  graphics.endStroke();
  // create the shape
  createjs.Shape.call(this, graphics);

};
ROS2D.Grid.prototype.__proto__ = createjs.Shape.prototype;