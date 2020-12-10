
var BX24Client = {
	call: function (method, params) {
		return new Promise(function (resolve, reject) {
			setTimeout(function () {
		    	BX24.callMethod(method, params, function (result) {
					if (result.error()) {
						return reject({
							error: result.error(),
							method: method,
							params: params
						});
					}
					resolve(result);
				});
		  	}, 500);
		});
	},

	next: function (result) {
		if (!result.more()) {
			return null;
		}
		return new Promise(function (resolve, reject) {
			setTimeout(function () {
				result.next(function (result) {
					if (result.error()) {
						return reject({
							error: result.error(),
							method: method,
							params: params
						});
					}
					resolve(result);
				});
			}, 500);
		});
	}
};

async function processProductsChunk(result) {
	var products = result.data();
	console.log(products.length);
	for (var i in products) {
		var resProd = await BX24Client.call('crm.product.get', {
			id: products[i].ID
		});
		console.log(products[i].ID, resProd.data());
		//console.log('[' + v.ID + '] ' + v.NAME);
	}
}

async function testCrmProductList() {
	var res = await BX24Client.call('crm.product.list', {
		//select: ['*', 'PROPERTY_*']
		select: ['ID']
	});
	await processProductsChunk(res);
	while (res.more()) {
		res = await BX24Client.next(res);
		await processProductsChunk(res);
	}
	console.log('Processing finished.');
	//console.error(e.method + ' -> ' + e.error, e.error);
}

BX24.ready(function () {
	testCrmProductList();
});
