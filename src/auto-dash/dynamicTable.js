// https://github.com/NithinBiliya/dynamic-table

angular.module('app', [])

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
  });