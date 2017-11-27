angular
	.module('tqSearchbox', [])
	.controller('TqSearchBoxController', TqSearchBoxController)
	.component('tqSearchbox', {
		templateUrl:  function() {
            return 'tq-searchbox.html';
        },
		controller: 'TqSearchBoxController',
		bindings: {
			placeholder: '@',
			startParameters: '<',
			parameters: '<',
			start: '&',
			enterBox: '&',
			leaveBox: '&',
			changeModel: '&',
			removeBox: '&',
			removeAll: '&'
		}
	});

function TqSearchBoxController($window, $timeout, $filter) {
	var vm = this;
	var oldOutput;
	var focusedKey;
	vm.innerParameters = null;
	vm.output = {
		query: '',
		parameters: []
	};

	vm.$onInit = function () {
    	vm.innerParameters = angular.copy(vm.parameters);
		angular.forEach(vm.startParameters, function (value, key) {
			if (key === 'query') {
				vm.output.query = value;
			} else {
				var indexOfParameter = findFromArray({key: key}, vm.innerParameters);
				var indexOfOutputParameter = findFromArray({key: key}, vm.output.parameters);
				var item = vm.innerParameters[indexOfParameter];
				item.value = value;
				if (indexOfOutputParameter !== -1) {
					vm.output.parameters[indexOfOutputParameter] = item;
				} else {
					vm.output.parameters.push(item);
				}
				deleteFromArray(item, vm.innerParameters);
			}
		});

		vm.start({resources: getOutputResources(vm.output)});
    };

    vm.$doCheck = function () {
    	if (!angular.equals(oldOutput, vm.output)) {
	    	vm.changeModel({resources: getOutputResources(vm.output)});
    		oldOutput = angular.copy(vm.output);
    	}
    };

    vm.selectSearchItem = function (item, model, label, event) {
    	vm.output.query = '';
    	vm.output.parameters.push(item);
    	focusOnItem(item);
    	deleteFromArray(item, vm.innerParameters);
    };

    vm.keydownOnParameter = function (event, parameter) {
    	if (event.keyCode === 13) {
			vm.checkInputValue(parameter)
    	}
    };

    vm.restoreSearch = function (parameter) {
    	focusOnItem(parameter);
    };

    vm.removeParameter = function (parameter) {
    	deleteFromArray(parameter, vm.output.parameters);
    	addToArray(parameter, vm.innerParameters);
    	vm.removeBox({resources: getOutputResources(vm.output)});
    };

    vm.removeAllParameters = function () {
    	vm.innerParameters = angular.copy(vm.parameters);
    	vm.output = {
			query: '',
			parameters: []
		};
		oldOutput = angular.copy(vm.output);
		vm.removeAll();
    };

    vm.checkInputValue = function (parameter) {
		focusedKey = '';
		vm.leaveBox({resources: getOutputResources(vm.output)});
		if (!parameter.value) {
			vm.removeParameter(parameter);
		}
    };

    vm.getSuggestions = function (parameter, viewValue) {
    	if (parameter.dynamic) {
    		return parameter.dynamicFunction(viewValue).then(function(response){
              return response;
            });
    	} else {
    		return $filter('filter')(parameter.suggestedValues, viewValue);
    	}
    };

    vm.ifFocused = function (parameter) {
    	return parameter.key === focusedKey;
    };

    function focusOnItem (parameter) {
    	focusedKey = parameter.key;
		$timeout(function() {
			var element = $window.document.getElementById(parameter.key);
			if(element)
				element.focus();
			}, 100
		);
		vm.enterBox({resources: getOutputResources(vm.output)});
	}

	function getOutputResources (output) {
		var parameterResources = {};
		if (output.query) {
			parameterResources.query = output.query;
		}

		angular.forEach(output.parameters, function(parameter) {
			parameterResources[parameter.key] = parameter.value;
		});

		return parameterResources;
	}
}

function deleteFromArray (item, array) {
	var index = findFromArray(item, array);
	array.splice(index, 1);
}

function addToArray (item, array) {
	item.value = '';
	array.push(item);
}

function findFromArray (item, array) {
	var index, i = 0;
	angular.forEach(array, function (element) {
		i++;
		if (item.key === element.key) {
			index = i - 1;
		}
	});
	if (index >= 0) {
		return index;
	} else {
		return -1;
	}
}


angular.module('tqSearchbox').run(['$templateCache', function($templateCache) {
  'use strict';

  $templateCache.put('tq-searchbox.html',
  	'<div id="tqSearchBox"> <div id="tqSearchBoxBorder"> <div id="tqSearchBoxCombo"> <div id="tqSearchBoxInputGroup" class="input-group input-group-sm" ng-repeat="parameter in $ctrl.output.parameters"> <span id="tqSearchBoxInputFront" class="input-group-addon">{{parameter.name}}:</span> <span id="tqSearchBoxFieldMid" class="input-group-addon" ng-show="!$ctrl.ifFocused(parameter) && parameter.value" ng-click="$ctrl.restoreSearch(parameter)">{{parameter.value}}</span> <input type="text" id="tqSearchBoxInputMid" ng-show="$ctrl.ifFocused(parameter)" class="form-control" ng-model="parameter.value" ng-attr-id="{{parameter.key}}" typeahead-min-length="0" typeahead-select-on-blur="true" ng-blur="$ctrl.checkInputValue(parameter)" ng-keydown="$ctrl.keydownOnParameter($event, parameter)" uib-typeahead="value as value for value in $ctrl.getSuggestions(parameter, $viewValue)"> <span id="tqSearchBoxInputEnd" class="input-group-addon"> <i class="glyphicon glyphicon-trash" ng-click="$ctrl.removeParameter(parameter)"></i> </span></div><input type="text" id="tqSearchBoxInput" placeholder="{{$ctrl.placeholder}}"ng-model="$ctrl.output.query"uib-typeahead="parameter as parameter.name for parameter in $ctrl.innerParameters | filter:$viewValue | orderBy: \'-name\' : true"typeahead-on-select="$ctrl.selectSearchItem($item, $model, $label, $event)"class="form-control"typeahead-min-length="0"typeahead-focus-on-select="false"><span id="tqSearchBoxInputTrash"><i class="glyphicon glyphicon-trash pointer" ng-click="$ctrl.removeAllParameters()"></i></span> </div></div></div>'
  	);
}]);
