/* eslint-env browser */

import Halyard from 'halyard.js';
import angular from 'angular';
import enigma from 'enigma.js';
import enigmaMixin from 'halyard.js/dist/halyard-enigma-mixin';
import qixSchema from 'enigma.js/schemas/3.2.json';
import template from './app.html';
import Scatterplot from './scatterplot';
import Linechart from './linechart';
import Arboreal from './arboreal.js'

const halyard = new Halyard();

angular.module('app', []).component('app', {
    bindings: {},
    controller: ['$scope', '$q', '$http', function Controller($scope, $q, $http) {
      $scope.dataSelected = false;
      $scope.showFooter = false;

      $scope.toggleFooter = () => {
        $scope.showFooter = !$scope.showFooter;
        if (!$scope.showFooter && $scope.dataSelected) {
          this.clearAllSelections();
        }
      };

      $scope.openGithub = () => {
        window.open('https://github.com/rongroth/core-get-started');
      };

      this.connected = false;
      this.painted = false;
      this.connecting = true;

      let app = null;
      let linechartObject = null;

      const linechartProperties = {
        qInfo: {
          qType: 'visualization',
          qId: '',
        },
        type: 'my-picasso-linechart',
        labels: true,
        qHyperCubeDef: {
          qDimensions: [{
            qDef: {
              qFieldDefs: ['timestamp'],
              qSortCriterias: [{
                qSortByAscii: 1,
              }],
            },
          }],
          qMeasures: [{
            qDef: {
              qDef: 'TPS',
              qLabel: 'TPS',
            },
            qSortBy: {
              qSortByNumeric: -1,
            },
          }, ],
          qInitialDataFetch: [{
            qTop: 0,
            qHeight: 10,
            qLeft: 0,
            qWidth: 2,
          }],
          qSuppressZero: false,
          qSuppressMissing: false,
        },
      };

      const linechart = new Linechart();

      const paintLineChart = (layout) => {
        linechart.paintLinechart(document.getElementById('chart-container-linechart'), layout);
        this.painted = true;
      };

      this.generateGUID = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        // eslint-disable-next-line no-bitwise
        const r = Math.random() * 16 | 0;
        // eslint-disable-next-line no-bitwise
        const v = c === 'x' ? r : ((r & 0x3) | 0x8);
        return v.toString(16);
      });

      this.$onInit = () => {
        const config = {
          Promise: $q,
          schema: qixSchema,
          mixins: enigmaMixin,
          url: `ws://${window.location.hostname}:19076/app/${this.generateGUID()}`,
        };

        // Add local data
        const filePath = '/data/idps-tps.csv';
        const tableTps = new Halyard.Table(filePath, {
          name: 'IDPS-TPS',
          fields: [{
              src: 'timestamp',
              name: 'timestamp'
            },
            {
              src: 'TPS',
              name: 'TPS'
            }
          ],
          delimiter: ',',
        });
        halyard.addTable(tableTps);

        enigma.create(config).open().then((qix) => {
          this.connected = true;
          this.connecting = false;
          qix.createSessionAppUsingHalyard(halyard).then((result) => {
            app = result;
            result.getAppLayout()
              .then(() => {
                result.createSessionObject(linechartProperties).then((model) => {
                  linechartObject = model;

                  const update = () => linechartObject.getLayout().then((layout) => {
                    console.log(layout);
                    paintLineChart(layout);
                  });

                  linechartObject.on('changed', update);
                  update();

                });
              });
          }, () => {
            this.error = 'Could not create session app';
            this.connected = false;
            this.connecting = false;
          });
        }, () => {
          this.error = 'Could not connect to QIX Engine';
          this.connecting = false;
        });
      };

      this.clearAllSelections = () => {
        if ($scope.dataSelected) {
          $scope.dataSelected = false;
          app.clearAll();
        }
        $scope.showFooter = false;
      };

    }],
    template,
  })

  .controller('myCtrl', ['$scope', '$http', '$timeout', function($scope, $http, $timeout) {

    $scope.personDetailsObject = {};
    $scope.personDetailsData = [];

    $scope.productTableStructure = {};
    $scope.productTableData = [];

    $http({
      method: 'GET',
      url: 'personDetailsStructure.json'
    }).then(function(response) {
      $scope.personDetailsObject = response.data;
    });
    $http({
      method: 'GET',
      url: 'personDetailsData.json'
    }).then(function(response) {
      $scope.personDetailsData = response.data;
    });


    $http({
      method: 'GET',
      url: 'productTableStructure.json'
    }).then(function(response) {
      $scope.productTableStructure = response.data;
    });
    $http({
      method: 'GET',
      url: 'productTableData.json'
    }).then(function(response) {
      $scope.productTableData = response.data;
    });
  }])

  .directive('dynamicTable', function($parse) {
    return {
      restrict: 'E',
      scope: {
        tablestructure: "=",
        tabledata: "="
      },
      templateUrl: 'dynamicTable.tmpl.html',
      link: function link(scope, element, attrs) {

        scope.$watch('tablestructure', function(newTablestructure) {
          // need to re-run the table generation everytime tablestructure changes
          generateTheDataStructure(newTablestructure, scope.tabledata);
        });

        function generateTheDataStructure(tablestructure, tabledata) {
          // convert tablestructure json object to Arboreal tree object
          var tableStructureTree = Arboreal.parse(tablestructure, 'columns');

          // iterator3 to calculate number of leaf nodes in the particular branch
          function iterator3(node) {
            if (node.children.length === 0)
              leafNodes++;
          }
          var treeDepth = 0;
          var leafNodes = 0;
          // iterator to calculate depth of the tree
          function iterator(node) {
            if (treeDepth < node.depth)
              treeDepth = node.depth
            leafNodes = 0;
            node.traverseDown(iterator3);
            node.leafNodes = leafNodes;
          }
          tableStructureTree.traverseDown(iterator);

          // iterator2 to calculate rowspan and colspan at each node
          // also calculate dataAccessString at each node
          function iterator2(node) {
            if (node.children.length === 0) {
              node.data.rs = treeDepth - node.depth + 1;
              node.data.cs = 1;
            } else {
              node.data.rs = 1;
              node.data.cs = node.leafNodes;
            }
            if (node.parent === null) {
              node.data.dataAccessString = node.data.id;
            } else {
              node.data.dataAccessString = node.parent.data.dataAccessString + "." + node.data.id;
            }
            node.data.getter = $parse(node.data.dataAccessString);
          }
          tableStructureTree.traverseDown(iterator2);

          // get list of nodes at kth level, where k ranges from 0 to treeDepth
          var iLevelList = [];
          scope.headerList = [];
          for (var i = 0; i <= treeDepth; i++) {
            iLevelList = [];
            tableStructureTree.drill(tableStructureTree, 0, i, iLevelList);
            scope.headerList.push(iLevelList);
          }

          scope.leafNodeList = [];
          // iterator4 to get list of all leaf nodes in the tree
          function iterator4(node) {
            if (node.children.length === 0) {
              scope.leafNodeList.push(node.data);
            }
          }
          tableStructureTree.traverseDown(iterator4);
          // scope.headerList -- holds list of nodes at kth level, where k ranges from 0 to treeDepth -- for displaying table header
          // scope.leafNodeList -- holds list of all leaf nodes in the tree -- for displaying table data
        }
      }
    };
  });;

angular.bootstrap(document, ['app']);