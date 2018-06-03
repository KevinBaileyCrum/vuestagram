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
    //#cart enumerate cart-stripe-singlepage
    var enumerate = function(v) {
        var k=0;
        return v.map(function(e) {e._idx = k++;});
    };

    self.get_products = function () {
        // Gets new products in response to a query, or to an initial page load.
        $.getJSON(products_url, $.param({q: self.vue.product_search}), function(data) {
            self.vue.products = data.products;

          (self.vue.products);
        });
    };

    self.store_cart = function() {
        localStorage.cart = JSON.stringify(self.vue.cart);
    };

    self.read_cart = function() {
        if (localStorage.cart) {
            self.vue.cart = JSON.parse(localStorage.cart);
        } else {
            self.vue.cart = [];
        }
        self.update_cart();
    };

    self.inc_desired_quantity = function(product_idx, qty) {
        // Inc and dec to desired quantity.
        var p = self.vue.products[product_idx];
        p.desired_quantity = Math.max(0, p.desired_quantity + qty);
        p.desired_quantity = Math.min(p.quantity, p.desired_quantity);
    };

    self.inc_cart_quantity = function(product_idx, qty) {
        // Inc and dec to desired quantity.
        var p = self.vue.cart[product_idx];
        p.cart_quantity = Math.max(0, p.cart_quantity + qty);
        p.cart_quantity = Math.min(p.quantity, p.cart_quantity);
        self.update_cart();
        self.store_cart();
    };

    self.update_cart = function () {
        enumerate(self.vue.cart);
        var cart_size = 0;
        var cart_total = 0;
        for (var i = 0; i < self.vue.cart.length; i++) {
            var q = self.vue.cart[i].cart_quantity;
            if (q > 0) {
                cart_size++;
                cart_total += q * self.vue.cart[i].price;
            }
        }
        self.vue.cart_size = cart_size;
        self.vue.cart_total = cart_total;
    };

    self.buy_product = function(product_idx) {
        var p = self.vue.products[product_idx];
        // I need to put the product in the cart.
        // Check if it is already there.
        var already_present = false;
        var found_idx = 0;
        for (var i = 0; i < self.vue.cart.length; i++) {
            if (self.vue.cart[i].id === p.id) {
                already_present = true;
                found_idx = i;
            }
        }
        // If it's there, just replace the quantity; otherwise, insert it.
        if (!already_present) {
            found_idx = self.vue.cart.length;
            self.vue.cart.push(p);
        }
        self.vue.cart[found_idx].cart_quantity = p.desired_quantity;

        // Updates the amount of products in the cart.
        self.update_cart();
        self.store_cart();
    };

    self.customer_info = {}

    self.goto = function (page) {
        self.vue.page = page;
        if (page == 'cart') {
            // prepares the form.
            self.stripe_instance = StripeCheckout.configure({
                key: 'pk_test_CeE2VVxAs3MWCUDMQpWe8KcX',    //put your own publishable key here
                image: 'https://stripe.com/img/documentation/checkout/marketplace.png',
                locale: 'auto',
                token: function(token, args) {
                    console.log('got a token. sending data to localhost.');
                    self.stripe_token = token;
                    self.customer_info = args;
                    self.send_data_to_server();
                }
            });
        };

    };

    self.pay = function () {
        self.stripe_instance.open({
            name: "Your nice cart",
            description: "Buy cart content",
            billingAddress: true,
            shippingAddress: true,
            amount: Math.round(self.vue.cart_total * 100),
        });
    };

    self.send_data_to_server = function () {
        console.log("Payment for:", self.customer_info);
        // Calls the server.
        $.post(purchase_url,
            {
                customer_info: JSON.stringify(self.customer_info),
                transaction_token: JSON.stringify(self.stripe_token),
                amount: self.vue.cart_total,
                cart: JSON.stringify(self.vue.cart),
            },
            function (data) {
                if (data.result === "ok") {
                    // The order was successful.
                    self.vue.cart = [];
                    self.update_cart();
                    self.store_cart();
                    self.goto('prod');
                    $.web2py.flash("Thank you for your purchase");
                } else {
                    $.web2py.flash("The card was declined.");
                }
            }
        );
    };


   // hw4 enum// var enumerate = function(v) { var k=0; return v.map(function(e) {e._idx = k++;});};

    self.open_uploader = function () {
        $("div#uploader_div").show();
        self.vue.is_uploading = true;
    };

    self.close_uploader = function () {
        $("div#uploader_div").hide();
        self.vue.is_uploading = false;
        $("input#file_input").val(""); // This clears the file choice once uploaded.

    };

    self.upload_file = function (event) {
        // Reads the file.
        var input = event.target.file_input;
        console.log('event');
        console.log(event);
        console.log('event.target.file_input as input');
        console.log(input);
        // console.log(event.target.file_input);
        var file = input.files[0];
        if (file) {
            // First, gets an upload URL.
            console.log("Trying to get the upload url");
            $.getJSON('https://upload-dot-luca-teaching.appspot.com/start/uploader/get_upload_url',
                function (data) {
                    // We now have upload (and download) URLs.
                    var put_url = data['signed_url'];
                    var get_url = data['access_url'];
                    console.log("Received upload url: " + put_url);
                    // Uploads the file, using the low-level interface.
                    var req = new XMLHttpRequest();
                    req.addEventListener("load", self.upload_complete(get_url));
                    // TODO: if you like, add a listener for "error" to detect failure.
                    req.open("PUT", put_url, true);
                    req.send(file);
                });
        }
    };


    self.upload_complete = function(get_url) {
        // Hides the uploader div.
        self.close_uploader();
        console.log('The file was uploaded; it is now available at ' + get_url);
        // The file is uploaded.  Now you have to insert the get_url into the database, etc.
        $.post(
            add_image_url,
            {
                image_url: get_url,
            },
            function(data){
                setTimeout( function(){
                    self.get_images( self.vue.current_user[0].user_id );
                }, 2000);
            }
        )
    };

    self.get_user_images = function () {
        $.getJSON(get_user_images_url, function (data) {
            self.vue.user_images = data.images;
            // enumerate(self.vue.user_images1);
        })
    };

    // self.get_images = function ( id ) {
    //     $.getJSON(get_images_url, function (data) {
    //         self.vue.user_images = data.images;
    //         enumerate(self.vue.user_images);
    //     })
    // };

    self.get_images = function ( id ) {
            $.post(get_images_url,
                {
                    id: id
                },
                function (data) {
                    self.vue.user_images = data.images;
                // enumerate(self.vue.user_images);
                }
            );
    };


    self.get_current_user = function () {
        $.getJSON(get_current_user_url, function (data) {
            self.vue.current_user = data.user;
            enumerate(self.vue.current_user);
        })
    };

    self.get_users = function () {
        $.getJSON(get_users_url, function (data) {
            self.vue.users = data.users;
            enumerate(self.vue.users);
        })
    };

    self.select_user = function ( id ) {
        console.log(id);
        self.vue.selected_user = id;

        console.log(self.vue.current_user[0].user_id);
        self.vue.self_page = (id == self.vue.current_user[0].user_id); // toggle plus

        self.get_images(id);
    };

    self.click = function () {
        console.log("clickity");
    }

    self.vue = new Vue({
        el: "#vue-div",
        delimiters: ['${', '}'],
        unsafeDelimiters: ['!{', '}'],
        data: {

            products: [],
            cart: [],
            product_search: '',
            cart_size: 0,
            cart_total: 0,
            page: 'prod',

            user_images: [],
            // user_images1: [],
            current_user: [],
            users: [],
            selected_user: null,
            is_uploading: false,
            self_page: true // Leave it to true, so initially you are looking at your own images
        },
        methods: {
            get_products: self.get_products,
            inc_desired_quantity: self.inc_desired_quantity,
            inc_cart_quantity: self.inc_cart_quantity,
            buy_product: self.buy_product,
            goto: self.goto,
            do_search: self.get_products,
            pay: self.pay,

            open_uploader: self.open_uploader,
            close_uploader: self.close_uploader,
            upload_file: self.upload_file,
            select_user: self.select_user,
            get_user_images: self.get_user_images,
        }

    });

    // cart's branch procucts implementation <<<<<<< cart-stripe-singlepage
    self.get_products();
    self.read_cart();
    $("#vue-div").show();

    // TODO: put get user call
    // self.get_images( );
    self.get_current_user();
    self.get_users();
    $("#vue-div").show();

    return self;
};

var APP = null;

// This will make everything accessible from the js console;
// for instance, self.x above would be accessible as APP.x
jQuery(function(){APP = app();});



