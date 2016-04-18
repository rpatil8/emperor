requirejs([
    "jquery",
    "underscore",
    "model",
    "view",
    "viewcontroller",
    "three",
    "shape-controller",
    "shape-editor",
    "shapes"
], function($, _, model, DecompositionView, viewcontroller, THREE,
            ShapeController, ShapeEditor, shapes) {
  $(document).ready(function() {
    var EmperorAttributeABC = viewcontroller.EmperorAttributeABC;
    var DecompositionModel = model.DecompositionModel;

    module("Shape Controller", {
      setup: function() {
        // setup function
        shapesAvailable = ['sphere', 'cube', 'cone', 'icosahedron', 'cylinder'];
        this.sharedDecompositionViewDict = {};
        var $slickid = $('<div id="fooligans"></div>');
        $slickid.appendTo(document.body);

        // setup function
        name = "pcoa";
        ids = ['PC.636', 'PC.635'];
        coords = [
          [-0.276542, -0.144964, 0.066647, -0.067711, 0.176070, 0.072969,
          -0.229889, -0.046599],
          [-0.237661, 0.046053, -0.138136, 0.159061, -0.247485, -0.115211,
          -0.112864, 0.064794]];
        pct_var = [26.6887048633, 16.2563704022, 13.7754129161, 11.217215823,
        10.024774995, 8.22835130237, 7.55971173665, 6.24945796136];
        md_headers = ['SampleID', 'LinkerPrimerSequence', 'Treatment', 'DOB'];
        metadata = [['PC.636', 'YATGCTGCCTCCCGTAGGAGT', 'Control', '20070314'],
        ['PC.635', 'YATGCTGCCTCCCGTAGGAGT', 'Fast', '20071112']];
        decomp = new DecompositionModel(name, ids, coords, pct_var, md_headers,
            metadata);
        var dv = new DecompositionView(decomp);
        this.sharedDecompositionViewDict.pcoa = dv;

        name = "biplot";
        ids = ['tax_1', 'tax_2'];
        coords = [
          [-1, -0.144964, 0.066647, -0.067711, 0.176070, 0.072969,
          -0.229889, -0.046599],
          [-0.237661, 0.046053, -0.138136, 0.159061, -0.247485, -0.115211,
          -0.112864, 0.064794]];
        pct_var = [26.6887048633, 16.2563704022, 13.7754129161, 11.217215823,
        10.024774995, 8.22835130237, 7.55971173665, 6.24945796136];
        md_headers = ['SampleID', 'Gram'];
        metadata = [['tax_1', '1'],
        ['tax_2', '0']];
        this.decomp = new DecompositionModel(name, ids, coords, pct_var, md_headers,
            metadata);
        this.dv = new DecompositionView(this.decomp);
        this.sharedDecompositionViewDict.biplot = dv;

        // Slickgrid
        var columns = [
        {id: "pc1", name: "pc1", field: "pc1"},
        {id: "pc2", name: "pc2", field: "pc2"},
        {id: "pc3", name: "pc3", field: "pc3"},
        ];

        var options = {
          enableCellNavigation: true,
          enableColumnReorder: false
        };
        var data = [];
        data.push({'pc1':1, 'pc2':1, 'pc3':1});
        data.push({'pc1':1, 'pc2':1, 'pc3':2});

        grid = new Slick.Grid("#fooligans", data, columns, options);
      },

      teardown: function() {
        // teardown function
      }
    });

    test("Shapes available list", function() {
      deepEqual(shapes.shapes, shapesAvailable);
    });

    test("Shapes dropdown", function() {
      var values = [];
      shapes.$shapesDropdown.find('option').each(function() {
          values.push($(this).attr('value'));
      });
      deepEqual(values, shapesAvailable);
    });

    test("Geometry creation", function() {
      var obs = shapes.getGeometry('sphere');
      var exp = new THREE.SphereGeometry(0.1, 8, 8);
      equal(typeof obs, typeof exp);
    });

    test("Geometry creation - unknown shape", function() {
      throws(function() {
        obs = shapes.getGeometry('Weird Unknown Shape');
      },
      Error, 'Throws an error if unknown shape passed');
    });

    test("Constructor tests", function(assert) {
      var container = $('<div id="does-not-exist" style="height:11px; width:12px"></div>');

      assert.ok(ShapeController.prototype instanceof EmperorAttributeABC);

      var controller = new ShapeController(container, this.sharedDecompositionViewDict);
      equal(controller.title, 'Shape');

      var testColumn = controller.bodyGrid.getColumns()[0];
      equal(testColumn.field, 'value');
    });

    test("Testing setPlottableAttributes helper function", function(assert) {
      // testing with one plottable
      var idx = 0;
      plottables = [{idx:idx}];
      equal(this.dv.markers[idx].geometry.type, 'SphereGeometry');
      equal(this.dv.markers[idx+1].geometry.type, 'SphereGeometry');
      ShapeController.setPlottableAttributes(this.dv, 'cube', plottables);
      equal(this.dv.markers[idx].geometry.type, 'BoxGeometry');
      equal(this.dv.markers[idx+1].geometry.type, 'SphereGeometry');

      // testing with multiple plottable
      plottables = [{idx:idx}, {idx:idx+1}];
      ShapeController.setPlottableAttributes(this.dv, 'cylinder', plottables);
      equal(this.dv.markers[idx].geometry.type, 'CylinderGeometry');
      equal(this.dv.markers[idx+1].geometry.type, 'CylinderGeometry');
    });

  });
});