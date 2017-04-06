var EbookAccess = function(){

    /**
     * Initialize the script
     *
     * @param language
     */
    var initialize = function(language){
        "use strict";

        if(isBook()){
            setLanguage(language);
            getData();
        }
    };

    /**
     * Data used for configuration such as request URL and the language.
     */
    var config = {
        request: {
            url: 'https://spreadsheets.google.com/feeds/list/1LVFhEjv_vsWbr0Zatr4dc_ySAeBYooiMTjfpJpS1UGw/od6/public/full?hl=en_US&alt=json'
        },
        language: 'sv', // Default language
        icons: [
            'viewonline',
            'download',
            'print',
            'loantime',
            'userlimit'
        ],
        icon: {
            size: 18,
            directory: 'http://sfxeu10.hosted.exlibrisgroup.com/sfxjon/img/sfxmenu/',
            fileType: 'svg'
        }
    };

    /**
     * Get data from Google Spreadsheets.
     */
    var getData = function(){
        "use strict";
        var JSONP = (function(){
            var that = {};

            that.send = function(src, options) {
                var callback_name = options.callbackName || 'callback',
                    on_success = options.onSuccess || function(){},
                    on_timeout = options.onTimeout || function(){},
                    timeout = options.timeout || 10; // sec

                var timeout_trigger = window.setTimeout(function(){
                    window[callback_name] = function(){};
                    on_timeout();
                }, timeout * 1000);

                window[callback_name] = function(data){
                    window.clearTimeout(timeout_trigger);
                    on_success(data);
                };

                var script = document.createElement('script');
                script.type = 'text/javascript';
                script.async = true;
                script.src = src;

                document.getElementsByTagName('head')[0].appendChild(script);
            };

            return that;
        })(),
            requestURL = config.request.url,
            cachedData = Cache.load();

        // Check if data is stored in session.
        if(cachedData){
            postData(cachedData);

        // If it isn't, load from API.
        } else {
            JSONP.send(requestURL+'&callback=response', {
                callbackName: 'response',
                onSuccess: function(data){
                    Cache.save(data);
                    postData(data);
                },
                onTimeout: function(){
                    window.console.warn('Connection to Google Spreadsheets has timed out.');
                },
                timeout: 5
            });
        }

    };

    /**
     * Post the data to the page.
     *
     * @param data Data from Google Spreadsheet's API in form of a JSON object.
     */
    var postData = function(data){
        "use strict";
        var language = config.language,
            icons = config.icons,
            iconDirectory = config.icon.directory,
            iconSize = config.icon.size,
            iconFileType = config.icon.fileType,
            entries = data.feed.entry;

        // Loop through all the entries in the spreadsheet.
        Array.prototype.forEach.call(entries, function(entry){

            // Check if the title object exists
            if(typeof entry.title === 'object'){

                // Loop through all the platforms on the web page.
                Array.prototype.forEach.call(document.querySelectorAll('.getFullTxt form'), function(platform){

                    // If the current platform matches name in entry.
                    if(platform.querySelector('.targetName').textContent.indexOf(entry.title.$t) >= 0){

                        // Convert data from Spreadsheet into a clean JavaScript Object
                        var platformData = formatData(entry);

                        // Create the list element
                        var list = document.createElement('ul');
                        list.className = 'source-information';

                        // Loop through all the icons for this source.
                        for (var key in platformData){
                            if(platformData.hasOwnProperty(key)){

                                // Create the list item and the corresponding icon
                                var li = document.createElement('li'),
                                    icon = document.createElement('img');

                                // Set the source and size of the icon
                                icon.setAttribute('src', iconDirectory+key+'.'+getColor(platformData[key].status)+'.'+iconFileType);
                                icon.setAttribute('height', iconSize);
                                icon.setAttribute('width', iconSize);
                                li.appendChild(icon);

                                // If there is a comment, add it
                                if(typeof platformData[key].comment === 'object' && platformData[key].comment[language].length > 0){
                                    var comment = document.createElement('div');
                                    comment.className = 'source-comment';
                                    comment.innerHTML = platformData[key].comment[language];
                                    li.appendChild(comment);
                                }
                                list.appendChild(li);
                            }
                        }
                        platform.appendChild(list);
                    }
                });
            }
        });

        /**
         * Converts the string to a object containing JSON data.
         *
         * @param {object} input Object containing the data.
         * @returns {object} Object containing the organized data.
         */
        function formatData(input){
            var output = {};

            // Add all icons that are defined in config and exists in the input string to the output.
            Array.prototype.forEach.call(icons, function(icon){

                // Check if the icon defined in the config exists in the data.
                if(typeof input['gsx$'+icon] !== 'undefined' && input['gsx$'+icon].$t !== 'Hidden' && input['gsx$'+icon].$t !== '') {
                    output[icon] = {};

                    // Set the status of the icon
                    output[icon].status = input['gsx$'+icon].$t;

                    // Check if a comment exists
                    if(typeof input['gsx$'+icon+'commentenglish'].$t !== 'undefined' && input['gsx$'+icon+'commentenglish'].$t !== '' && typeof input['gsx$'+icon+'commentswedish'].$t !== 'undefined' && input['gsx$'+icon+'commentswedish'].$t !== ''){
                        output[icon].comment = {};
                        output[icon].comment.sv = '<p>'+input['gsx$'+ icon + 'commentswedish'].$t.replace('. ', '.</p><p>')+'</p>';
                        output[icon].comment.en = '<p>'+input['gsx$'+ icon + 'commentenglish'].$t.replace('. ', '.</p><p>')+'</p>';
                    }
                }
            });
            return output;
        }

        /**
         * Get color connected to a specified status
         * @param {String}  input
         * @returns {String} color
         */
        function getColor(input){
            var colors = {
                'Yes': 'Green',
                'Exception': 'Yellow',
                'No': 'Red'
            };
            return colors[input];
        }
    };

    /**
     * Sets the language used in the document
     *
     * @param language
     */
    var setLanguage = function(language){
        "use strict";
        config.language = language;
    };

    /**
     * Is the current title a book?
     *
     * @returns {boolean}
     */
    var isBook = function() {
        "use strict";
        // This script is dependent on SFX keeping the IDs and Classes for their elements.
        return (document.querySelector('#titleInfo #iSource .Z3988').getAttribute('title').indexOf('rft.genre=book') >= 0);
    };

    var Cache = {
        // TODO: Add cross domain support.

        /**
         * # Save
         * Saves data to cache in sessionStorage with timestamp.
         * @param {Object} data
         */
        save: function(data){
            "use strict";
            sessionStorage.setItem('ebookAccessData',JSON.stringify(data));
        },

        /**
         * ## Load
         * Checks if data is not too old and then loads from cache in sessionStorage.
         * @returns {Object} data
         */
        load: function(){
            "use strict";
            // Check if object exists in LocalStorage.
            if(sessionStorage.hasOwnProperty('ebookAccessData')) {
                return JSON.parse(sessionStorage.getItem('ebookAccessData'));
            }
            return false;
        }
    };

    return {
        initialize: initialize
    }
}();