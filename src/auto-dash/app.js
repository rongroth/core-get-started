/* eslint-env browser */

import Halyard from 'halyard.js';
import angular from 'angular';
import enigma from 'enigma.js';
import enigmaMixin from 'halyard.js/dist/halyard-enigma-mixin';
import qixSchema from 'enigma.js/schemas/3.2.json';
import template from './app.html';
import Scatterplot from './scatterplot';
import Linechart from './linechart';

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
});

angular.bootstrap(document, ['app']);