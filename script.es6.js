
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

// выборка сделок с привязанными контактами и компаниями

async function processDealsChunkBatch(result) {
	var deals = result.data();
	console.log(deals.length);
	var cmd = {};
	var hasData = false;
	var contactIds = [];
	var companyIds = [];

	for (var i in deals) {
		console.log('deal', deals[i]);
		// собрать id привязанных контактов
		if (deals[i].CONTACT_ID) {
			contactIds.push(deals[i].CONTACT_ID);
		}
		// собрать id привязанных компаний
		if (deals[i].COMPANY_ID) {
			companyIds.push(deals[i].COMPANY_ID);
		}
	}

	if (contactIds.length) {
		// добавить в batch запрос на контакты по полученным id
		cmd['contacts'] = ['crm.contact.list', {
			filter: {
				ID: contactIds,
			}
		}];
		hasData = true;
	}

	if (companyIds.length) {
		// добавить в batch запрос на компании по полученным id
		cmd['companies'] = ['crm.company.list', {
			filter: {
				ID: companyIds,
			}
		}];
		hasData = true;
	}

	if (hasData) {
		console.log('batch: ', cmd);
		var res = await BX24Client.callBatch(cmd);
		// чтото делаем с результатами
		if ('contacts' in res) {
			console.log('contacts data: ', res.contacts.data());
		}
		if ('companies' in res) {
			console.log('companies data: ', res.companies.data());
		}
	}
}

async function testCrmDealsList() {
	var res = await BX24Client.call('crm.deal.list', {
		select: ['*', 'UF_*']
	});
	await processDealsChunkBatch(res);
	while (res.more()) {
		res = await BX24Client.next(res);
		await processDealsChunkBatch(res);
	}
	console.log('Processing deals finished.');
}

BX24.ready(function () {
	//testCrmProductList();

	testCrmDealsList();
});
