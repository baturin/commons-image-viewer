
wikivoyageApi = {
    baseUrl: 'https://ru.wikivoyage.org/w/api.php',

    executeRequest: function(parameters, onSuccess) {
        $.ajax({
            url: this.baseUrl,
            data: parameters,
            crossDomain: true,
            dataType: 'jsonp'
        }).done(function(data) {
            onSuccess(data);
        });
    },

    getPage: function(page, onSuccess) {
        log.info('Get Wikivoyage page "' + page + '"');
        this.executeRequest(
            {
                'action': 'query',
                'prop': 'revisions',
                'rvprop': 'content',
                'rvlimit': '1',
                'titles': page,
                'format': 'json'
            },
            function(data) {
                if (!data || !data.query || !data.query.pages) {
                    return;
                }
                var pages = data.query.pages;
                var firstPage = pages[Object.keys(pages)[0]];

                if (!firstPage || !firstPage.revisions|| firstPage.revisions.length <= 0) {
                    return;
                }

                onSuccess(firstPage.revisions[0]['*']);
            }
        )
    }
};