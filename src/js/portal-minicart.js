;(function ( $, window, document, undefined ) {
    var pluginName = "vtexCartItems",
        defaults = {
            orderFormId: 0,
            timeoutToHide: 0,
        };
    function vtexCartItems( element, options ) {
        this.element = element;

        this.options = $.extend( {}, defaults, options );

        this._defaults = defaults;
        this._name = pluginName;

        this.init();
    }

    vtexCartItems.prototype = {

        init: function() {
            this.getData(true);
            $(window).on('miniCartMouseOver',function() {
                $('.vtexsc-cart').slideDown();
                clearTimeout(self.options.timeoutToHide);
            });
            $(window).on('miniCartMouseOut',function() {
                clearTimeout(self.options.timeoutToHide);
                self.options.timeoutToHide = setTimeout(function() {
                    $('.vtexsc-cart').stop(true, true).slideUp();
                }, 800);
            });
            $(window).on('cartUpdated',function() {
                $('.vtexsc-cart').slideDown();
                self.options.timeoutToHide = setTimeout(function() {
                    $('.vtexsc-cart').stop(true, true).slideUp();
                }, 2000);
            });
        },

        getData: function(items) {
            self = this;

            // vtexMinicartGetData
            var promise = $.ajax({
                url: '/api/checkout/pub/orderForm/',
                data: JSON.stringify({"expectedOrderFormSections":["items", "paymentData", "totalizers"]}),
                dataType: 'json',
                contentType: 'application/json; charset=utf-8',
                type: 'POST'
            });

            // data = minicartJson;
            promise.done(function(data) {
                self.options.orderFormId = data.orderFormId;

                if (items) self.insertCartItems(data);
                self.changeCartValues(data);
                if (!items) self.updateItems(data);
            });
            promise.fail(function(jqXHR, textStatus, errorThrown) {
                console.log('Error Message: '+textStatus);
                console.log('HTTP Error: '+errorThrown);
            });
            return promise;
            // return JSON.stringify(minicartJson);
        },
        insertCartItems: function(data) {
            self = this;

            // vtexMinicartInsertCartItems
            if (data) {
                var items = data.items;
                var total = 0;

                $.each(data.totalizers, function(i, t) {
                    total += t.value;
                });

                var miniCart = '<div class="v2-vtexsc-cart vtexsc-cart mouseActivated preLoaded" style="display: none;">\
                    <div class="vtexsc-bt"></div>\
                        <div class="vtexsc-center">\
                            <div class="vtexsc-wrap">\
                                <table class="vtexsc-productList">\
                                    <thead style="display: none;">\
                                        <tr>\
                                            <th class="cartSkuName" colspan="2">Produto</th>\
                                            <th class="cartSkuPrice">Preço</th>\
                                            <th class="cartSkuQuantity">Quantidade</th>\
                                            <th class="cartSkuActions">Excluir</th>\
                                        </tr>\
                                    </thead>\
                                    <tbody></tbody>\
                                </table>\
                            </div>\
                            <div class="cartFooter clearfix">\
                                <div class="cartTotal">\
                                    Total\
                                    <span class="vtexsc-totalCart">\
                                        <span class="vtexsc-text">R$ ' + self.formatCurrency(total) + '</span>\
                                    </span>\
                                </div>\
                                <a href="/checkout/#/orderform" class="cartCheckout"></a>\
                            </div>\
                        </div>\
                        <div class="vtexsc-bb"></div>\
                    </div>';

                $(self.element).after(miniCart);

                self.updateItems(data);

                $('.vtexsc-cart').mouseover(function() {
                    $(window).trigger('miniCartMouseOver');
                }).mouseout(function() {
                    $(window).trigger('miniCartMouseOut');
                });
            }
        },
        updateItems: function(data) {
            self = this;

            //vtexMinicartUpdateItems
            if (data) {
                var items = data.items;
                var total = 0;

                $.each(data.totalizers, function(i, t) {
                    total += t.value;
                });

                $('.vtexsc-productList tbody').html('');

                $.each(items, function(i, c) {
                    var item = '<tr>\
                        <td class="cartSkuImage">\
                            <a class="sku-imagem" href="' + c.detailUrl + '"><img height="71" width="71" alt="' + c.name + '" src="' + c.imageUrl + '" /></a>\
                        </td>\
                        <td class="cartSkuName">\
                            <h4><a href="' + c.detailUrl + '">' + c.name + '</a><br /></h4>\
                        </td>\
                        <td class="cartSkuPrice">\
                            <div class="cartSkuUnitPrice">\
                                <span class="bestPrice">R$ ' + self.formatCurrency(c.price) + '</span>\
                            </div>\
                        </td>\
                        <td class="cartSkuQuantity">\
                            <div class="cartSkuQtt">\
                                <span class="cartSkuQttTxt"><span class="vtexsc-skuQtt">' + c.quantity + '</span></span>\
                            </div>\
                        </td>\
                        <td class="cartSkuActions">\
                            <span class="cartSkuRemove" data-index="'+ i +'">\
                                <a href="javascript:void(0);" class="text" style="display: none;">excluir</a>\
                            </span>\
                        </td>\
                    </tr>';

                    $('.vtexsc-productList tbody').append(item);

                });

                $('.vtexsc-productList .cartSkuRemove').click(function() {
                    var elem = $(this);
                    var promise = $.ajax({
                        url: '/api/checkout/pub/orderForm/'+ self.options.orderFormId +'/items/update/',
                        data: JSON.stringify({"expectedOrderFormSections":["items", "paymentData", "totalizers"], "orderItems": [{"index": elem.data('index'), "quantity": 0}]}),
                        dataType: 'json',
                        contentType: 'application/json; charset=utf-8',
                        type: 'POST'
                    });
                    promise.success(function(data) {
                        self.changeCartValues(data);
                        self.updateItems(data);
                        $(window).trigger('cartUpdated');
                    });
                    promise.fail(function(jqXHR, textStatus, errorThrown) {
                        console.log('Error Message: '+textStatus);
                        console.log('HTTP Error: '+errorThrown);
                    });
                });
            }
        },
        changeCartValues: function(data) {
            //vtexMinicartChangeCartValues
            if (data) {
                var items = data.items;
                var total = 0;

                $.each(data.totalizers, function(i, t) {
                    total += t.value;
                });

                $('.vtexsc-totalCart .vtexsc-text').text('R$ ' + this.formatCurrency(total));
                $('.carrinhoCompras > a, .linkCart').attr('href', '/checkout/#/cart');
            }
        },
        formatCurrency: function(value) { 
            //vtexMinicartFormatCurrency
            num = isNaN(value) || value === '' || value === null ? 0.00 : value / 100; return parseFloat(num).toFixed(2).replace('.',',').toString().replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1.');
        },
        showMinicart: function(value) { 
            //vtexMinicartShowMinicart
            var promise = this.getData();
            promise.done(function() {
                $('.vtexsc-cart').slideDown();
                clearTimeout(this.options.timeoutToHide);
                this.options.timeoutToHide = setTimeout(function() {
                    $('.vtexsc-cart').slideUp();
                }, 3000);
            });
        }

    };

    // Um invólucro realmente leve em torno do construtor,
    // prevenindo contra criação de múltiplas instâncias
    $.fn[pluginName] = function ( options ) {
        return this.each(function () {
            if (!$.data(this, "plugin_" + pluginName)) {
                $.data(this, "plugin_" + pluginName, new vtexCartItems( this, options ));
            }
        });
    };

})( jQuery, window, document );
$('script#vtex-minicart').vtexCartItems();