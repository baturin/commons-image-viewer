
application = {
    _currentImages: [],
    _currentPage: 0,
    _itemsPerPage: 64,
    _itemsPerRow: 4,
    _paginationListItems: {},

    init: function() {
        this.bindHandlers();
    },

    bindHandlers: function() {
        var self = this;

        $('#viewCommonsCategory').click(function() {
            self.viewCommonsCategory(self._getCurrentCommonsCategory());
        });
        $('#addCommonsCategory').click(function() {
            self.addCommonsCategory(self._getCurrentCommonsCategory());
        });
        $('#viewNaturalHeritageCategory').click(function() {
            self.viewNaturalHeritageCategory(self._getCurrentNaturalHeritageCategory());
        });
        $('#addNaturalHeritageCategory').click(function () {
            self.addNaturalHeritageCategory(self._getCurrentNaturalHeritageCategory());
        });
        $('#viewCulturalHeritageCategory').click(function() {
            self.viewCulturalHeritageCategory(self._getCurrentCulturalHeritageCategory());
        });
        $('#addCulturalHerigateCategory').click(function () {
            self.addCulturalHeritageCategory(self._getCurrentCulturalHeritageCategory());
        });
        $('#clearCache').click(function() {
            cacheStorage.clear();
        });
    },

    /**
     * Add images of specified category and all subcategories to the list of images.
     *
     * @param category category name
     */
    addCommonsCategory: function(category) {
        var self = this;

        $('#images').html('Loading list of images...');

        commonsApi.getAllSubcategories(category, function(subcategories) {
            var allCategories = [];
            allCategories = allCategories.concat([category]);
            allCategories = allCategories.concat(subcategories);

            runSequence(
                allCategories.map(function(category) {
                    return function(onSuccess) {
                        commonsApi.getCategoryImages(category, 'max', function (images) {
                            images.forEach(function(image) {
                                self._currentImages.push(image);
                            });
                            onSuccess();
                        });
                    }
                }),
                function() {
                    self._currentImages = uniq(self._currentImages);
                    self._updatePaginator();
                    self.setPage(0);
                }
            );
        });
    },

    /**
     * View images of specified category and all subcategories.
     *
     * @param category category name
     */
    viewCommonsCategory: function(category) {
        this._currentImages = [];
        this.addCommonsCategory(category);
    },

    /**
     * Add images of specified natural heritage category (Wikivoyage page) to the list of images.
     *
     * @param category category name (Wikivoyage page name)
     */
    addNaturalHeritageCategory: function(category) {
        var self = this;
        wikivoyageApi.getPage(
            'Природные_памятники_России/' + category,
            function(data) {
                var categoryIds = self.parseCategoryIds(data);
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

    /**
     * View images of specified natural heritage category (Wikivoyage page).
     *
     * @param category category name (Wikivoyage page name)
     */
    viewNaturalHeritageCategory: function(category) {
        this._currentImages = [];
        this.addNaturalHeritageCategory(category);
    },

    /**
     * Add images of specified cultural heritage category (Wikivoyage page) to the list of images.
     *
     * @param category category name (Wikivoyage page name)
     */
    addCulturalHeritageCategory: function(category) {
        var self = this;
        wikivoyageApi.getPage(
            'Культурное_наследие_России/' + category,
            function(data) {
                var categoryIds = self.parseCategoryIds(data);
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

    /**
     * View images of specified cultural heritage category (Wikivoyage page).
     *
     * @param category category name (Wikivoyage page name)
     */
    viewCulturalHeritageCategory: function(category) {
        this._currentImages = [];
        this.addCulturalHeritageCategory(category);
    },

    _updatePaginator: function() {
        var self = this;
        this._paginationListItems = {};
        var paginationBlocks = [$('#topPaginator'), $('#bottomPaginator')];

        paginationBlocks.forEach(function(paginationBlock) {
            paginationBlock.html('');
        });

        paginationBlocks.forEach(function(paginationBlock) {
            var link = $('<a>', {'href': 'javascript:;'});
            link.html('<');
            var listItem = $('<li>');
            listItem.append(link);
            paginationBlock.append(listItem);
            link.click(function () {
                if (self._currentPage > 0) {
                    application.setPage(self._currentPage - 1);
                }
            });
        });

        var pages = this._currentImages.length / this._itemsPerPage;

        for (var i = 0; i < pages; i++) {
            this._paginationListItems[i] = [];

            paginationBlocks.forEach(function(paginationBlock) {
                var addPaginatorLink = function (pageNum) {
                    var link = $('<a>', {'href': 'javascript:;'});
                    link.html((pageNum + 1));
                    var listItem = $('<li>');
                    listItem.append(link);
                    paginationBlock.append(listItem);

                    self._paginationListItems[pageNum].push(listItem);

                    link.click(function () {
                        application.setPage(pageNum);
                    });
                };
                addPaginatorLink(i);
            });
        }

        paginationBlocks.forEach(function(paginationBlock) {
            var link = $('<a>', {'href': 'javascript:;'});
            link.html('>');
            var listItem = $('<li>');
            listItem.append(link);
            paginationBlock.append(listItem);
            link.click(function () {
                if (self._currentPage < pages - 1) {
                    application.setPage(self._currentPage + 1);
                }
            });
        });
    },

    setPage: function(page) {
        var self = this;
        this._currentPage = page;

        // 1) Update pagination
        Object.keys(this._paginationListItems).forEach(function(paginationPage) {
            if (parseInt(paginationPage) === page) {
                self._paginationListItems[paginationPage].forEach(function(paginationListItem) {
                    paginationListItem.addClass('active');
                });
            } else {
                self._paginationListItems[paginationPage].forEach(function(paginationListItem) {
                    paginationListItem.removeClass('active');
                });
            }
        });

        // 2) Load images
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
    },

    parseCategoryIds: function(pageContents) {
        var categoryIds = [];
        var knidStrs = pageContents.match(/knid\s*=\s*\d+/g);
        knidStrs.forEach(function(knidStr) {
            var categoryIdResult = knidStr.match(/\d+/);
            if (categoryIdResult && categoryIdResult.length > 0) {
                categoryIds.push(categoryIdResult[0]);
            }
        });
        return categoryIds;
    },

    _getCurrentCommonsCategory: function() {
        return $('#commonsCategory').val();
    },

    _getCurrentNaturalHeritageCategory: function() {
        return $('#naturalHeritageCategory').val();
    },

    _getCurrentCulturalHeritageCategory: function() {
        return $('#culturalHeritageCategory').val();
    }
};

$.when($.ready).then(function() {
    log.init();
    application.init();
});
