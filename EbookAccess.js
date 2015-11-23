var EbookAccess = {
    /**
     * Initialize the script
     *
     * @param language
     */
    initialize: function(language){
        var getData = EbookAccess.getData,
            setLanguage = EbookAccess.setLanguage,
            isBook = EbookAccess.isBook;

        // Is the current title a book?
        if(isBook()){
            setLanguage(language);
            getData();
        }
    },

    /**
     * Data used for configuration such as request URL and the language.
     */
    config: {
        request: {
            url: 'https://spreadsheets.google.com/feeds/list/1LVFhEjv_vsWbr0Zatr4dc_ySAeBYooiMTjfpJpS1UGw/od6/public/basic?hl=en_US&alt=json'
        },
        language: 'sv', // Default language
        icons: [
            'viewonline',
            'download',
            'print',
            'loantime',
            'userlimit'
        ],
        iconDirectory: 'http://sfxeu10.hosted.exlibrisgroup.com/sfxjon/img/sfxmenu/'
    },

    /**
     * Get data from Google Spreadsheets.
     */
    getData: function(){
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
                    }

                    var script = document.createElement('script');
                    script.type = 'text/javascript';
                    script.async = true;
                    script.src = src;

                    document.getElementsByTagName('head')[0].appendChild(script);
                }

                return that;
            })(),
            requestURL = EbookAccess.config.request.url,
            postData = EbookAccess.postData;

        JSONP.send(requestURL+'&callback=response', {
            callbackName: 'response',
            onSuccess: function(json){
                postData(json);
            },
            onTimeout: function(){
                console.warn('Connection to Google Spreadsheets has timed out.');
            },
            timeout: 5
        });
    },

    /**
     * Post the data to the page.
     *
     * @param data Data from Google Spreadsheet's API in form of a JSON object.
     */
    postData: function(data){
        var language = EbookAccess.config.language,
            icons = EbookAccess.config.icons,
            iconDirectory = EbookAccess.config.iconDirectory;

        // TODO: Split this function up in smaller functions

        // Loop through all the entries in the spreadsheet.
        Array.prototype.forEach.call(data.feed.entry, function(entry){

            // If the title object exist
            if(typeof entry.title === 'object'){

                // Loop through all the platforms on the web page.
                Array.prototype.forEach.call(document.querySelectorAll('.getFullTxt td form'), function(platform){

                    // If the current platform matches name in entry.
                    if(platform.querySelector('.targetName').textContent.indexOf(entry.title.$t) >= 0){

                        // Convert data from Spreadsheet into a clean JavaScript Object
                        var platformData = stringToObject(entry.content.$t),
                            list = document.createElement('ul');
                            list.className = 'source-information';

                        // Loop through all the icons for this source.
                        for (var key in platformData){
                            var li = document.createElement('li'),
                                icon = document.createElement('img');

                            icon.setAttribute('src', iconDirectory+key+'.'+getColor(platformData[key].status)+'.svg')
                            icon.setAttribute('height', '18');
                            icon.setAttribute('width', '18');
                            li.appendChild(icon);

                            // If there is a comment, add it
                            if(typeof platformData[key].comment === 'object' && platformData[key].comment[language].length > 0){
                                var comment = document.createElement('div');
                                comment.className = 'source-comment';
                                comment.textContent = platformData[key].comment[language];
                                li.appendChild(comment)
                            }
                            list.appendChild(li);
                        };
                        platform.appendChild(list);
                    };
                });
            }
        });

        /**
         * Converts the string to a object containing JSON data.
         *
         * @param {string} string String containing the data.
         * @returns {object} Object containing the organized data.
         */
        function stringToObject(string){
            var input = {},
                output = {},
                tempValues = string.split(',');

            for(var i = 0; i < string.split(',').length; i++){
                input[tempValues[i].split(':')[0].replace(/\s+/g,' ').trim()] = tempValues[i].split(':')[1].replace(/\s+/g,' ').trim();
            }

            // Add all icons that are defined in config and exists in the input string to the output.
            Array.prototype.forEach.call(icons, function(icon){
                if(typeof input[icon] != 'undefined' && input[icon] !== 'Hidden' && input[icon] != '') {
                    output[icon] = {}
                    output[icon].status = input[icon];
                    if(typeof input[icon + 'commentenglish'] != 'undefined' && typeof input[icon + 'commentswedish'] != 'undefined'){
                        output[icon].comment = {};
                        output[icon].comment.sv = input[icon + 'commentswedish'];
                        output[icon].comment.en = input[icon + 'commentenglish'];
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
    },

    /**
     * Sets the language used in the document
     *
     * @param lang
     */
    setLanguage: function(language){
        EbookAccess.config.language = language;
    },

    /**
     * Is the current title a book?
     *
     * @returns {boolean}
     */
    isBook: function() {

        // This script is dependent on SFX keeping the IDs and Classes for their elements.
        return (document.querySelector('#titleInfo #iSource .Z3988').getAttribute('title').indexOf('rft.genre=book') >= 0);
    }
};