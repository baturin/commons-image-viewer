function stripPrefix(str, prefix)
{
    if (str.lastIndexOf(prefix, 0) === 0) {
        return str.substr(prefix.length);
    } else {
        return null;
    }
}

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

log = {
    init: function() {
        this.logControl = $('#log');
        this.logControl.val('');
    },
    info: function(message) {
        this.logControl.val(
            this.logControl.val() + message + "\n"
        );
        this.logControl.scrollTop(this.logControl[0].scrollHeight);
    }
};

commonsApi = {
    baseUrl: 'https://commons.wikimedia.org/w/api.php',

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

    getSubcategories: function(category, onSuccess) {
        log.info('Get subcategories of category "' + category + '"');

        this.executeRequest(
            {
                'action': 'query',
                'list': 'categorymembers',
                'cmtype': 'subcat',
                'cmtitle': 'Category:' + category,
                'cmlimit': 'max',
                'format': 'json'
            },
            function(data) {
                if (data.query && data.query.categorymembers) {
                    var subcategories = [];
                    data.query.categorymembers.forEach(function(member) {
                        if (member.title) {
                            var subcategory = stripPrefix(member.title, 'Category:');
                            if (subcategory) {
                                subcategories.push(subcategory);
                            }
                        }
                    });

                    onSuccess(subcategories);
                }
            }
        );
    },

    getAllSubcategories: function(category, onSuccess) {
        var self = this;
        var allCategories = [];
        walkTree(
            category,
            function(category, onSuccess) {
                self.getSubcategories(category, function(subcategories) {
                    subcategories.forEach(function(subcat) {
                        allCategories.push(subcat);
                    });
                    onSuccess(subcategories);
                });
            },
            function () {
                onSuccess(allCategories);
            }
        );
    },

    getCategoryFiles: function(category, limit, onSuccess) {
        log.info('Get files of category "' + category + '"');

        this.executeRequest(
            {
                'action': 'query',
                'list': 'categorymembers',
                'cmtype': 'file',
                'cmtitle': 'Category:' + category,
                'cmlimit': limit,
                'format': 'json'
            },
            function(data) {
                if (data.query && data.query.categorymembers) {
                    var files = [];
                    data.query.categorymembers.forEach(function(member) {
                        if (member.title) {
                            files.push(member.title);
                        }
                    });

                    onSuccess(files);
                }
            }
        );
    },

    getCategoryImages: function(category, limit, onSucess) {
        this.getCategoryFiles(category, limit, function(files) {
            var images = [];
            files.forEach(function(file) {
                var extension = file.toLowerCase().substr(file.length - 4);
                if (extension === '.jpg' || extension === '.png' || extension === '.gif') {
                    images.push(file);
                }
            });
            onSucess(images);
        })
    },

    getImageInfo: function(image, onSuccess) {
        log.info('Get image info of "' + image + '"');

        this.executeRequest(
            {
                'action': 'query',
                'titles': image,
                'prop': 'imageinfo',
                'iiprop': 'url',
                'iiurlwidth': '200',
                'iiurlheight': '200',
                'format': 'json'
            },
            function(data) {
                if (!data.query || !data.query.pages) {
                    return;
                }

                var pages = data.query.pages;
                var firstPage = pages[Object.keys(pages)[0]];
                if (!firstPage || !firstPage.imageinfo || firstPage.imageinfo.length <= 0) {
                    return;
                }
                var imageInfo = firstPage.imageinfo[0];
                onSuccess({
                    'thumb': imageInfo.thumburl,
                    'url': imageInfo.url
                });
            }
        )
    },

    getImagesInfo: function(images, onSuccess) {
        var self = this;
        runSequence(
            images.map(function(image) {
                return function(onSuccess) {
                    self.getImageInfo(image, onSuccess);
                }
            }),
            function(imageInfos) {
                onSuccess(imageInfos);
            }
        );
    }
};

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