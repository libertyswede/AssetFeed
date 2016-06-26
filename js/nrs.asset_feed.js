/**
 * @depends {nrs.js}
 */

var NRS = (function(NRS, $, undefined) {
	var assets = [];
	var properties = [];
	var news = [];
	var logos = [];
	var assetNews = [];
	var assetProperties = [];
	var currentNewsIndex = 0;
	var initialized = false;

	NRS.pages.p_asset_feed = function() {
		
		if (initialized == true) {
			return;
		}
		initialized = true;

		$.when({})
			.then(p_asset_feed_get_assets)
			.then(p_asset_feed_get_news)
			.then(p_asset_feed_get_logo)
			.then(p_asset_feed_get_properties)
			.then(p_asset_feed_show);

		$('#p_asset_feed_assets').on('change', function (e) {
			p_asset_feed_show_asset(this.value);
		});
		$('#p_asset_feed_previous').click(function() {
			if (--currentNewsIndex < 0)
			{
				currentNewsIndex = assetNews.length - 1;
			}
			p_asset_feed_update_news();
		});
		$('#p_asset_feed_next').click(function() {
			if (++currentNewsIndex == assetNews.length)
			{
				currentNewsIndex = 0;
			}
			p_asset_feed_update_news();
		});
	}

	p_asset_feed_update_news = function() {
		var currentNews = assetNews[currentNewsIndex];
		var newsText = String(currentNews.data).autoLink();
		var newsDate = NRS.formatTimestamp(currentNews.transactionTimestamp, true);
		$('#p_asset_feed_news_feed').html(newsText + " (published " + newsDate + ")");
	}

	p_asset_feed_show_asset = function(assetId) {
		var asset = $.grep(assets, function(a) {
			if (a.asset == assetId) {
				return a;
			}
		})[0];

		assetNews = $.grep(news, function(n) {
			if (n.tags == asset.asset) {
				return n;
			}
		});
		if (assetNews.length > 0) {
			assetNews.sort(function (a, b) {
				return a.transactionTimestamp < b.transactionTimestamp ? 1 : -1;
			});
			p_asset_feed_update_news();
		} else {
			$('#p_asset_feed_news_feed').text("No news is good news!");
		}

		assetProperties = $.grep(properties, function(p) {
			if (p.assetId == asset.asset) {
				return p;
			}
		});
		$.each(assetProperties, function(i, property) {
			var row = "<tr>";
			row += "<td>" + property.name + "</td>";
			row += "<td>" + String(property.value).autoLink() + "</td>";
			row += "</tr>";
			$('#p_asset_feed_properties_table tr:last').after(row);
		});


		$('#p_asset_feed_asset_name').text(asset.name);
		$('#p_asset_feed_asset_id').html(NRS.getTransactionLink(assetId));
		$('#p_asset_feed_account').html(NRS.getAccountLink(asset, "account"));
		$('#p_asset_feed_asset_quantity').html(NRS.formatQuantity(asset.quantityQNT, asset.decimals));
		$("#p_asset_feed_asset_decimals").html(String(asset.decimals).escapeHTML());
		$('#p_asset_feed_asset_description').html(String(asset.description).autoLink());
	}

	p_asset_feed_show = function() {
		assets.sort(function(a, b){
			return a.name.toUpperCase() > b.name.toUpperCase() ? 1 : -1;
		});

		$.each(assets, function(i, asset) {
			$('#p_asset_feed_assets').append($('<option/>', { 
				value: asset.asset,
				text : asset.name + " (" + asset.asset + ")"
			}));
		});
		currentNewsIndex = 0;
		$('#p_asset_feed_assets option:eq(0)').prop('selected', true);
		p_asset_feed_show_asset(assets[0].asset);
		NRS.dataLoaded("");
	}

	p_asset_feed_get_assets = function() {
		var dfd = $.Deferred();
		var assetIds = [];

		NRS.sendRequest("getAccountAssets", { "account": NRS.account }, function(response) {
			$.each(response.accountAssets, function(i, accountAsset) {
				assetIds.push(accountAsset.asset);
			});
			NRS.sendRequest("getAssets", { "assets": assetIds }, function(response) {
				$.each(response.assets, function(i, asset) {
					assets.push(asset);
				});
				return dfd.resolve();
			});
		});
		return dfd.promise();
	}

	p_asset_feed_get_news = function() {
		var dfd = $.Deferred();
		var count = 0;
		$.each(assets, function(i, asset) {
			NRS.sendRequest("searchTaggedData", { "account": asset.account, "tag": asset.asset, "channel": "news", "includeData": "true" }, function(response) {
				$.each(response.data, function(j, taggedData){
					news.push(taggedData);
				});
				if (count++ == assets.length - 1) {
					dfd.resolve();
				}
			});
		});
		return dfd.promise();
	}

	p_asset_feed_get_logo = function() {
		var dfd = $.Deferred();
		var count = 0;
		$.each(assets, function(i, asset) {
			NRS.sendRequest("searchTaggedData", { "account": asset.account, "tag": asset.asset, "channel": "logo" }, function(response) {
				$.each(response.data, function(j, taggedData){
					logos.push(taggedData);
				});
				if (count++ == assets.length - 1) {
					dfd.resolve();
				}
			});
		});
		return dfd.promise();
	}

	p_asset_feed_get_properties = function() {
		var dfd = $.Deferred();
		var count = 0;
		$.each(assets, function(i, asset) {
			NRS.sendRequest("getAccountProperties", { "recipient": asset.account, "setter": asset.account }, function(response) {
				$.each(response.properties, function(j, property) {
					if (property.property.length > 20 && property.property.substring(0, 20) == asset.asset && property.property.substring(20).trim().length > 0) {
						var propertyName = property.property.substring(20).trim();
						properties.push({ assetId: asset.asset, name: propertyName, value: property.value});
					}
				});
				if (count++ == assets.length - 1) {
					dfd.resolve();
				}
			});
		});
		return dfd.promise();
	}

	NRS.setup.p_asset_feed = function() {
		//Do one-time initialization stuff here
	}

	return NRS;
}(NRS || {}, jQuery));

//File name for debugging (Chrome/Firefox)
//# sourceURL=nrs.asset_feed.js