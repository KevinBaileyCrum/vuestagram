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
    var enumerate = function(v) {
        var k=0;
        return v.map(function(e) {e._idx = k++;});
    };

    self.get_products = function () {
        // Gets new products in response to a query, or to an initial page load.
        $.getJSON(products_url, $.param({q: self.vue.product_search}), function(data) {
            self.vue.products = data.products;
            enumerate(self.vue.products);
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
            page: 'prod'
        },
        methods: {
            get_products: self.get_products,
            inc_desired_quantity: self.inc_desired_quantity,
            inc_cart_quantity: self.inc_cart_quantity,
            buy_product: self.buy_product,
            goto: self.goto,
            do_search: self.get_products,
            pay: self.pay
        }

    });

    self.get_products();
    self.read_cart();
    $("#vue-div").show();


    return self;
};

var APP = null;

// This will make everything accessible from the js console;
// for instance, self.x above would be accessible as APP.x
jQuery(function(){APP = app();});
