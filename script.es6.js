
// bitrix24 js api Promise-обертка для использования с async/await

var BX24Client = {
	call: function (method, params) {
		return new Promise((resolve, reject) => {
			setTimeout(function () {
		    	BX24.callMethod(method, params, (result) => {
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

	callBatch: function (calls, bHaltOnError = false) {
		return new Promise((resolve, reject) => {
			setTimeout(function () {
		    	BX24.callBatch(calls, (result) => {
		    		resolve(result);
				}, bHaltOnError);
		  	}, 500);
		});
	},

	next: function (result) {
		if (!result.more()) {
			return null;
		}
		return new Promise((resolve, reject) => {
			setTimeout(function () {
				result.next((result) => {
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

// пример последовательной выборки и обработки

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

// пример выборки и обработки через batch

async function processProductsChunkBatch(result) {
	var products = result.data();
	console.log(products.length);
	var cmd = {};
	var hasData = false;
	for (var i in products) {
		console.log('add to batch: ', products[i].ID);
		//console.log('[' + v.ID + '] ' + v.NAME);
		cmd['P_' + products[i].ID] = ['crm.product.get', {
			id: products[i].ID
		}];
		hasData = true;
	}
	if (hasData) {
		var resProducts = await BX24Client.callBatch(cmd);
		for (var k in resProducts) {
			console.log(resProducts[k].data());
		}
	}
}

// выборка товаров

async function testCrmProductList() {
	var res = await BX24Client.call('crm.product.list', {
		//select: ['*', 'PROPERTY_*']
		select: ['ID']
	});
	//await processProductsChunk(res);
	await processProductsChunkBatch(res);
	while (res.more()) {
		res = await BX24Client.next(res);
		//await processProductsChunk(res);
		await processProductsChunkBatch(res);
	}
	console.log('Processing finished.');
	//console.error(e.method + ' -> ' + e.error, e.error);
}

BX24.ready(function () {
	testCrmProductList();
});
