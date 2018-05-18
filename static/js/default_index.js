// This is the js for the default/index.html view.


var app = function() {

    var self = {};

    Vue.config.silent = false; // show all warnings

    // Extends an array
    self.extend = function(a, b) {
        for (var i = 0; i < b.length; i++) {
            a.push(b[i]);
        }
    };

    // Enumerates an array.
    var enumerate = function(v) { var k=0; return v.map(function(e) {e._idx = k++;});};

    self.open_uploader = function () {
        // First, gets an upload URL.
        console.log("Trying to get the upload url");
        $.getJSON('https://upload-dot-luca-teaching.appspot.com/start/uploader/get_upload_url',
            function (data) {
                // We now have upload (and download) URLs.
                var put_url = data['signed_url'];
                var get_url = data['access_url'];
                console.log("Received upload url: " + put_url);
                // Creates the uploader.
                self.dropzone = new Dropzone("div#uploader_div", {
                    url: put_url,
                    maxFilesize: 40, // MB
                    addRemoveLinks: false,
                    parallelUploads: 1,
                    acceptedFiles: 'image/jpeg',
                    createImageThumbnails: false,
                    init: function () {
                        this.on("addedfile", function () {
                            if (this.files.length > 1) {
                                this.removeFile(this.files[0]);
                            }
                        });
                        this.on("success", function (file, response) {
                            this.removeAllFiles();
                            self.upload_complete(get_url, response);
                        })
                    }
                });
                // Displays the div.
                $("div#uploader_div").show();
            });
    };


    self.upload_complete = function(get_url, response) {
        // Hides the uploader div.
        $("div#uploader_div").hide();
        console.log('The file was uploaded; it is now available at ' + get_url);

        // The file is uploaded.  Now you have to insert it into the database, etc.
        // COMPLETE
    };


    self.vue = new Vue({
        el: "#vue-div",
        delimiters: ['${', '}'],
        unsafeDelimiters: ['!{', '}'],
        data: {
        },
        methods: {
            open_uploader: self.open_uploader
        }

    });

    $("#vue-div").show();

    return self;
};

var APP = null;

// This will make everything accessible from the js console;
// for instance, self.x above would be accessible as APP.x
jQuery(function(){APP = app();});

