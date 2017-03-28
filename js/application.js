
application = {
    _currentImages: [],
    _currentPage: 0,
    _itemsPerPage: 64,
    _itemsPerRow: 4,

    updateCategory: function() {
        var self = this;
        $('#images').html('Loading list of images...');
        commonsApi.getAllSubcategories(getCurrentCategory(), function(subcategories) {
            self._currentImages = [];
            runSequence(
                subcategories.map(function(subcategory) {
                    return function(onSuccess) {
                        commonsApi.getCategoryImages(subcategory, 'max', function (images) {
                            images.forEach(function(image) {
                                self._currentImages.push(image);
                            });
                            onSuccess();
                        });
                    }
                }),
                function() {
                    self._updatePaginator();
                    self.setPage(0);
                }
            );
        });
    },

    updateNature: function() {
        var self = this;
        wikivoyageApi.getPage(
            'Природные_памятники_России/' + getCurrentNature(),
            function(data) {
                var categoryIds = parseCategoryIds(data);
                self._currentImages = [];
                runSequence(
                    categoryIds.map(function(categoryId) {
                        return function(onSuccess) {
                            commonsApi.getCategoryImages(
                                'Protected_areas_of_Russia/' + categoryId, 'max',
                                function (images) {
                                    images.forEach(function(image) {
                                        self._currentImages.push(image);
                                    });
                                    onSuccess();
                                }
                            );
                        }
                    }),
                    function() {
                        self._updatePaginator();
                        self.setPage(0);
                    }
                );
            }
        );
    },

    updateCulture: function() {
        var self = this;
        wikivoyageApi.getPage(
            'Культурное_наследие_России/' + getCurrentCulture(),
            function(data) {
                var categoryIds = parseCategoryIds(data);
                self._currentImages = [];
                runSequence(
                    categoryIds.map(function(categoryId) {
                        return function(onSuccess) {
                            commonsApi.getCategoryImages(
                                'WLM/' + categoryId, 'max',
                                function (images) {
                                    images.forEach(function(image) {
                                        self._currentImages.push(image);
                                    });
                                    onSuccess();
                                }
                            );
                        }
                    }),
                    function() {
                        self._updatePaginator();
                        self.setPage(0);
                    }
                );
            }
        );
    },

    _updatePaginator: function() {
        var paginator = $('#paginator');
        paginator.html('');
        for (var i = 0; i < this._currentImages.length / this._itemsPerPage; i++) {
            var addPaginatorLink = function(pageNum) {
                var link = $('<a>', {'href': 'javascript:;'});
                link.html((pageNum + 1));
                link.click(function () {
                    application.setPage(pageNum);
                });
                var listItem = $('<li>');
                listItem.append(link);
                paginator.append(listItem);
            };
            addPaginatorLink(i);
        }
    },

    setPage: function(page) {
        var self = this;
        this._currentPage = page;
        var imagesBlock = $('#images');
        imagesBlock.html('Loading images info...');

        var pageImages = this._currentImages.slice(
            this._currentPage * this._itemsPerPage,
            (this._currentPage + 1) * this._itemsPerPage
        );
        commonsApi.getImagesInfo(pageImages, function(imagesInfo) {
            imagesBlock.html('');

            for (var row = 0; row < self._itemsPerPage / self._itemsPerRow; row++) {
                var rowElem = $('<div>', {'style': 'display: flex; flex-direction: row;'});
                $('#images').append(rowElem);

                for (var col = 0; col < self._itemsPerRow; col++) {
                    var itemNum = row * self._itemsPerRow + col;
                    if (imagesInfo.length > itemNum) {
                        var imageInfo = imagesInfo[itemNum];
                        var link = $('<a>', {'href': imageInfo.url});
                        var image = $('<img>', {'src': imageInfo.thumb});
                        link.append(image);
                        var imageBlock = $('<div>', {'style': 'padding: 5px; width: 210px; display: flex; flex-direction: row; justify-content: center; align-items: center; align-content: center;'});
                        imageBlock.append(link);
                        rowElem.append(imageBlock);
                    }
                }
            }
        });
    }
};


function parseCategoryIds(pageContents)
{
    var categoryIds = [];
    var knidStrs = pageContents.match(/knid\s*=\s*\d+/g);
    knidStrs.forEach(function(knidStr) {
        var categoryIdResult = knidStr.match(/\d+/);
        if (categoryIdResult && categoryIdResult.length > 0) {
            categoryIds.push(categoryIdResult[0]);
        }
    });
    return categoryIds;
}

$.when( $.ready ).then(function() {
    log.init();
    $('#setCategory').click(function() { application.updateCategory(); });
    $('#setNature').click(function() { application.updateNature(); });
    $('#setCulture').click(function() { application.updateCulture(); });
    $('#clearCache').click(function() { cacheStorage.clear(); } );
});

function getCurrentCategory()
{
    return $('#category').val();
}

function getCurrentNature()
{
    return $('#nature').val();
}

function getCurrentCulture()
{
    return $('#culture').val();
}