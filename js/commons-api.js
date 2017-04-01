
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

        var self = this;

        getCachedValue('subcategories', category, onSuccess, function(category, onSuccess) {
            self.executeRequest(
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
        });
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

        var self = this;

        getCachedValue('category-files', category, onSuccess, function(category, onSuccess) {
            self.executeRequest(
                {
                    'action': 'query',
                    'list': 'categorymembers',
                    'cmtype': 'file',
                    'cmtitle': 'Category:' + category,
                    'cmlimit': 'max',
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
        });
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

        var self = this;

        getCachedValue('image-info', image, onSuccess, function(image, onSuccess) {
            self.executeRequest(
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
                        'image': image,
                        'thumb': imageInfo.thumburl,
                        'url': imageInfo.url
                    });
                }
            )
        });
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