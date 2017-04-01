function runSequence(functions, onSuccess, results) {
    if (!results) {
        results = [];
    }

    if (functions.length > 0) {
        var firstFunction = functions[0];
        firstFunction(function(result) {
            results.push(result);
            setTimeout( // hack to break recursion chain
                function() {
                    runSequence(functions.slice(1), onSuccess, results)
                },
                0
            );
        });
    } else {
        onSuccess(results);
    }
}

function walkTree(startNode, walkNodeFunction, onSuccess, visitedNodes) {
    if (!visitedNodes) {
        visitedNodes = [];
    }
    visitedNodes.push(startNode);
    walkNodeFunction(startNode, function(childNodes) {
        runSequence(
            childNodes.map(function(childNode) {
                return function(onSuccess) {
                    if (visitedNodes.indexOf(childNode) === -1 ) {
                        walkTree(childNode, walkNodeFunction, onSuccess, visitedNodes);
                    } else {
                        onSuccess();
                    }
                }
            }),
            onSuccess
        );
    });
}