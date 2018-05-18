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
        $("div#uploader_div").show();
    };

    self.upload_file = function (event) {
        // Reads the file.
        var input = event.target;
        var file = input.files[0];
        var reader = new FileReader();
        if (file) {
            reader.onload = function (e) {
                // First, gets an upload URL.
                console.log("Trying to get the upload url");
                $.getJSON('https://upload-dot-luca-teaching.appspot.com/start/uploader/get_upload_url',
                    function (data) {
                        // We now have upload (and download) URLs.
                        var put_url = data['signed_url'];
                        var get_url = data['access_url'];
                        console.log("Received upload url: " + put_url);
                        // Uploads the file.
                        $.ajax(
                            url: put_url,
                            type: 'POST',,
                            data: reader.result;

                        )
                        // Displays the div.
                    });
            };
            reader.readAsBinaryString(file);
        }
    };





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
            open_uploader: self.open_uploader,
            upload_file: self.upload_file
        }

    });

    $("#vue-div").show();

    return self;
};

var APP = null;

// This will make everything accessible from the js console;
// for instance, self.x above would be accessible as APP.x
jQuery(function(){APP = app();});

