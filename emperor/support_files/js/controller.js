define([
    "jquery",
    "underscore",
    "three",
    "view",
    "scene3d",
    "colorviewcontroller",
    "visibilitycontroller"

], function ($, _, THREE, DecompositionView, ScenePlotView3D,
             ColorViewController, VisibilityController) {

  /**
   *
   * @name EmperorController
   *       This is the application controller
   *
   * @class Contains all the information on how the model is being presented to
   *        the user.
   *
   * @param {dm} a DecompositionModel object that will be
   * represented on screen.
   * @param {divid} the jQuery id correponding to the controller
   * @param {webglcanvas} the canvas to use to render the information. This
   * parameter is optional, and should rarely be set. But is useful for
   * external applications like SAGE2.
   *
   **/
  EmperorController = function(dm, divId, webglcanvas){
    var scope = this;

    // Constants
    this.GRID_SCALE = 0.97;         // Scaling constant for grid dimensions
    this.SCENE_VIEW_SCALE = 0.5;   // Scaling constant for scene plot view dimensions
    this.SLICK_WIDTH = 25;         // Constant for width in slick-grid

    this.$divId = $('#' + divId);
    this.width = this.$divId.width();
    this.height = this.$divId.height();

    this.dm = dm;
    this.sceneViews = [];

    // main divs where the content of the plots will be located
    this.$plotSpace = $("<div id='main-wrapper' class='emperor-plot-wrapper'></div>");
    this.$plotMenu = $("<div class='emperor-plot-menu'></div>");

    this.$divId.append(this.$plotSpace);
    this.$divId.append(this.$plotMenu);

    // holds a reference to all the tabs (view controllers) in the $plotMenu
    this.controllers = {};

    // set up the renderer
    this.rendererBackgroundColor = new THREE.Color();
    this.rendererBackgroundColor.setHex('0x000000');

    if (webglcanvas !== undefined){
        this.renderer = new THREE.WebGLRenderer({canvas: webglcanvas,
                                                 antialias: true});
    }
    else{
        this.renderer = new THREE.WebGLRenderer({antialias: true});
    }

    this.renderer.setSize(this.width, this.height);
    this.renderer.setClearColor(this.rendererBackgroundColor);
    this.renderer.autoClear = false;
    this.renderer.sortObjects = true;
    this.$plotSpace.append(this.renderer.domElement);

    // menu tabs containers, note that we need them in this format to have
    // jQuery's UI tabs work properly. All the view controllers will be added
    // to this container, see the addTab method
    this._$tabsContainer = $("<div name='emperor-tabs-container'></div>");
    this._$tabsContainer.css('background-color', '#EEEEEE');
    this._$tabsList = $("<ul name='emperor-tabs-list'></ul>");

    // These will both live in the menu space. As of the writing of this code
    // there's nothing else but tabs on the menu, but this may change in the
    // future, that's why we are creating the extra "tabsContainer" div
    this.$plotMenu.append(this._$tabsContainer);
    this._$tabsContainer.append(this._$tabsList);

    // FIXME: This is a hack to go around the fact that the constructor takes
    // a single decomposition model instead of a dictionary
    this.decViews = {'scatter': new DecompositionView(this.dm)};

    // default decomposition view uses the full window
    this.addView();

    $(function() {
      scope.buildUI();
    });

    // once the object finishes loading, resize the contents so everything fits
    // nicely
    $(this).ready(function() {
      scope.resize(scope.$divId.width(), scope.$divId.height());
    });

  };

  /**
   *
   * Helper method to add additional ScenePlotViews (i.e. another plot)
   *
   **/
  EmperorController.prototype.addView = function() {
    if (this.sceneViews.length > 4) {
      throw Error('Cannot add another scene plot view');
    }

    var spv = new ScenePlotView3D(this.renderer, this.decViews,
        this.$plotSpace.attr('id'), 0, 0, 0, 0);
    this.sceneViews.push(spv);

    // this will setup the appropriate sizes and widths
    this.resize(this.width, this.height);
  };

  /**
   *
   * Helper method to resize the plots
   *
   * @param {width} the width of the entire plotting space
   * @param {height} the height of the entire plotting space
   *
   **/
  EmperorController.prototype.resize = function(width, height){
    // update the available space we have
    this.width = width;
    this.height = height;

    this.$plotSpace.height(height);
    this.$plotMenu.height(height);

    this._$tabsContainer.height(height);

    // the area we have to present the plot is smaller than the total
    var plotWidth = this.$plotSpace.width();

    // TODO: The below will need refactoring
    // This is addressed in issue #405
    if (this.sceneViews.length === 1) {
      this.sceneViews[0].resize(0, 0, plotWidth, this.height);
    }
    else if (this.sceneViews.length === 2) {
      this.sceneViews[0].resize(0, 0, this.SCENE_VIEW_SCALE * plotWidth,
          this.height);
      this.sceneViews[1].resize(this.SCENE_VIEW_SCALE * plotWidth, 0,
          this.SCENE_VIEW_SCALE * plotWidth, this.height);
    }
    else if (this.sceneViews.length === 3) {
      this.sceneViews[0].resize(0, 0,
          this.SCENE_VIEW_SCALE * plotWidth,
          this.SCENE_VIEW_SCALE * this.height);
      this.sceneViews[1].resize(this.SCENE_VIEW_SCALE * plotWidth, 0,
          this.SCENE_VIEW_SCALE * plotWidth,
          this.SCENE_VIEW_SCALE * this.height);
      this.sceneViews[2].resize(0, this.SCENE_VIEW_SCALE * this.height,
          plotWidth, this.SCENE_VIEW_SCALE * this.height);
    }
    else if (this.sceneViews.length === 4) {
      this.sceneViews[0].resize(0, 0, this.SCENE_VIEW_SCALE * plotWidth,
          this.SCENE_VIEW_SCALE * this.height);
      this.sceneViews[1].resize(this.SCENE_VIEW_SCALE * plotWidth, 0,
          this.SCENE_VIEW_SCALE * plotWidth,
          this.SCENE_VIEW_SCALE * this.height);
      this.sceneViews[2].resize(0, this.SCENE_VIEW_SCALE * this.height,
          this.SCENE_VIEW_SCALE * plotWidth,
          this.SCENE_VIEW_SCALE * this.height);
      this.sceneViews[3].resize(this.SCENE_VIEW_SCALE * plotWidth,
          this.SCENE_VIEW_SCALE * this.height,
          this.SCENE_VIEW_SCALE * plotWidth,
          this.SCENE_VIEW_SCALE * this.height);
    }
    else {
      throw Error('More than four views are currently not supported');
    }

    this.renderer.setSize(plotWidth, this.height);

    /* Resizing the tabs (view controllers) */

    // resize the grid according to the size of the container, since we are
    // inside the tabs we have to account for that lost space.
    var tabHeight = this.$plotMenu.height() * this.GRID_SCALE;

    // the tab list at the top takes up a variable amount of space and
    // without this, the table displayed below will have an odd scrolling
    // behaviour
    tabHeight -= this._$tabsList.height();

    // for each controller, we need to (1) trigger the resize method, and (2)
    // resize the height of the containing DIV tag (we don't need to resize the
    // width as this is already taken care of since it just has to fit the
    // available space).
    _.each(this.controllers, function(controller, index){
      if(controller !== undefined){
        $('#' + controller.identifier).height(tabHeight);

        var w = $('#' + controller.identifier).width(),
            h = $('#' + controller.identifier).height();

        controller.resize(w, h);
      }
    });
  };

  /**
   *
   * Helper method to render sceneViews
   *
   **/
  EmperorController.prototype.render = function() {
    this.renderer.setViewport(0, 0, this.width, this.height);
    this.renderer.clear();
    for (var i = 0; i < this.sceneViews.length; i++) {
      this.sceneViews[i].render();
    }
  };

  /**
   *
   * Helper method to assemble UI, completely independent of HTML template
   *
   **/
  EmperorController.prototype.buildUI = function() {
    var scope = this;

    //FIXME: This only works for 1 scene plot view
    this.controllers.color = this.addTab(this.sceneViews[0].decViews,
                                         ColorViewController);
    this.controllers.visibility = this.addTab(this.sceneViews[0].decViews,
                                              VisibilityController);

    // We are tabifying this div, I don't know man.
    this._$tabsContainer.tabs({heightStyle: 'fill',
                               // The tabs on the plot space only get resized
                               // when they are visible, thus we subscribe to
                               // the event that's fired after a user selects a
                               // tab.  If you don't do this, the width and
                               // height of each of the view controllers will
                               // be wrong.  We also found that subscribing to
                               // document.ready() wouldn't work either as the
                               // resize callback couldn't be executed on a tab
                               // that didn't exist yet.
                               activate: function(event, ui){
                                 scope.resize(scope.$divId.width(),
                                              scope.$divId.height());
                               }});
  };

  /**
   *
   * Helper method to resize the plots.
   *
   * @param {Array} [dvdict] Dictionary of DecompositionViews.
   * @param {function} [viewConstructor] Constructor of the view controller.
   *
   **/
  EmperorController.prototype.addTab = function(dvdict, viewConstructor){
    // nothing but a temporary id
    var id = (Math.round(1000000 * Math.random())).toString();

    this._$tabsContainer.append("<div id='" + id +
                                "' class='emperor-tab-div' ></div>");
    $('#' + id).height(this.$plotMenu.height() - this._$tabsList.height());

    // dynamically instantiate the controller, see:
    // http://stackoverflow.com/a/8843181
    var obj = new (Function.prototype.bind.apply(viewConstructor,
          [null, '#' + id, dvdict]));

    // set the identifier of the div to the one defined by the object
    $('#' + id).attr('id', obj.identifier);

    // now add the list element linking to the container div with the proper
    // title
    this._$tabsList.append("<li><a href='#" + obj.identifier + "'>" +
        obj.title + "</a></li>");

    return obj;
  };

  return EmperorController;
});