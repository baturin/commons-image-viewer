function runSequence(functions, onSuccess, results) {
    if (!results) {
        results = [];
    }

    if (functions.length > 0) {
        var firstFunction = functions[0];
        firstFunction(function(result) {
            results.push(result);
            runSequence(functions.slice(1), onSuccess, results);
        });
    } else {
        onSuccess(results);
    }
}

function walkTree(startNode, walkNodeFunction, onSuccess) {
    walkNodeFunction(startNode, function(childNodes) {
        runSequence(
            childNodes.map(function(childNode) {
                return function(onSuccess) {
                    walkTree(childNode, walkNodeFunction, onSuccess);
                }
            }),
            onSuccess
        );
    });
}