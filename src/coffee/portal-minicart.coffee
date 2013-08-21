$ = window.jQuery

#
# Class
#
class Minicart
	constructor: (context, options) ->
		@EXPECTED_ORDER_FORM_SECTIONS = ["items", "paymentData", "totalizers"]

		@options = $.extend {}, $.fn.minicart.defaults, options
		@context = context
		@hoverContext = @context.add('.show-minicart-on-hover')
		@cartData = {}

		@base = $('.minicartListBase').remove()

		@select =
			amountProducts: => $('.amount-products-em', @context)
			amountItems: => $('.amount-items-em', @context)
			totalCart: => $('.total-cart-em', @context)

		@bindEvents()
		@updateCart()

		$(window).trigger "minicartLoaded"

	getOrderFormURL: =>
		"/api/checkout/pub/orderForm/"

	getOrderFormUpdateURL: =>
		@getOrderFormURL() + @cartData.orderFormId + "/items/update/"

	bindEvents: =>
		@hoverContext.on 'mouseover', ->
			$(window).trigger "minicartMouseOver"

		@hoverContext.on 'mouseout', ->
			$(window).trigger "minicartMouseOut"

		$(window).on "minicartMouseOver", =>
			if @cartData.items?.length > 0
				$(".vtexsc-cart").slideDown()
				clearTimeout @timeoutToHide

		$(window).on "minicartMouseOut", =>
			clearTimeout @timeoutToHide
			@timeoutToHide = setTimeout ->
				$(".vtexsc-cart").stop(true, true).slideUp()
			, 800

		$(window).on "cartUpdated", (event, cartData, show) =>
			if cartData
				@cartData = cartData
				@prepareCart()
				@render()

				if cartData.items.length is 0
					$(".vtexsc-cart").slideUp()
				else if show
					$(".vtexsc-cart").slideDown()
					@timeoutToHide = setTimeout ->
						$(".vtexsc-cart").stop(true, true).slideUp()
					, 3000

			else
				@getData()

		$(window).on 'productAddedToCart', =>
			@updateData()

	updateCart: =>
		@context.addClass 'amount-items-in-cart-loading'

		$.ajax({
			url: @getOrderFormURL()
			data:
				expectedOrderFormSections: @EXPECTED_ORDER_FORM_SECTIONS
			dataType: "json"
			contentType: "application/json; charset=utf-8"
			type: "POST"
		})
		.done =>
			@context.removeClass 'amount-items-in-cart-loading'
		.success (data) =>
			@cartData = data
			@prepareCart()
			@render()

	prepareCart: =>
		# Amount Items
		@cartData.amountItems = 0
		@cartData.amountItems += item.quantity for item in @cartData.items

		# Total
		total = 0
		for subtotal in @cartData.totalizers
			total += subtotal.value if subtotal.id in ['Items', 'Discounts']
		@cartData.totalCart = @options.valuePrefix + _.formatCurrency(total / 100, @options) + @options.valueSufix

		# Item labels
		for item in @cartData.items
			item.availabilityMessage = @getAvailabilityMessage(item)
			item.formattedPrice = @options.valuePrefix + _.formatCurrency(item.price / 100, @options) + @options.valueSufix

	render: () =>
		dust.render 'minicart', @cartData, (err, out) =>
			console.log 'Minicart Dust error: ', err if err
			@context.html out
			$(".vtexsc-productList .cartSkuRemove", @context).on 'click', =>
				@deleteItem(this)

	deleteItem: (item) =>
		$(item).parent().find('.vtexsc-overlay').show()

		$.ajax({
			url: @getOrderFormUpdateURL()
			data:
				expectedOrderFormSections: @EXPECTED_ORDER_FORM_SECTIONS
				orderItems: [
					index: $(item).data("index")
					quantity: 0
				]
			dataType: "json"
			contentType: "application/json; charset=utf-8"
			type: "POST"
		})
		.success (data) =>
			@cartData = data
			@prepareCart()
			@render()

	getAvailabilityCode: (item) =>
		item.availability or "available"

	getAvailabilityMessage: (item) =>
		@options.availabilityMessages[@getAvailabilityCode(item)]


#
# Plugin
#
$.fn.minicart = (options) ->
	return this if @hasClass("plugin_minicart")
	@addClass("plugin_minicart")
	new Minicart(this, options)
	return this

$.fn.minicart.defaults =
	valuePrefix: "R$ "
	valueSufix: ""
	availabilityMessages:
		"available": ""
		"unavailableItemFulfillment": "Este item não está disponível no momento."
		"withoutStock": "Este item não está disponível no momento."
		"cannotBeDelivered": "Este item não está disponível no momento."
		"withoutPrice": "Este item não está disponível no momento."
		"withoutPriceRnB": "Este item não está disponível no momento."
		"nullPrice": "Este item não está disponível no momento."


#
# EXPORTS
#
window.vtex or= {}
vtex.portalPlugins or= {}
vtex.portalPlugins.Minicart = Minicart
