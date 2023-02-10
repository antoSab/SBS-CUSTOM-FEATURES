/**
 * @description       :
 * @author            : Antonio Sabatino
 * @group             :
 * @last modified on  : 09-30-2022
 * @last modified by  : Antonio Sabatino
**/
@isTest
public class SSG_ContractProductSelectorHelper_TEST {

	@isTest
	static void getProductsTest(){

		Integer productNum = 10;
		createProducts(productNum);

		List<String> fields = new List<String>();
		List<String> filterName = new List<String>();
		List<String> filterValue = new List<String>();
		String name = 'P-CODE-1';
		String isoCode = 'EUR';

		fields.add('Id');
		fields.add('Name');
		filterName.add('Catalog__c');
		filterValue.add('Current');
		filterName.add('Partner_Product__c');
		filterValue.add('true');
		filterName.add('Sub_GTM__c');
		filterValue.add('SBP Cards');

		List<Product2> prodList = SSG_ContractProductSelectorHelper.getProducts(fields, filterName, filterValue, name, isoCode);

		System.assert(prodList.size() >= 1);

	}

	@isTest
	static void getRelatedOptionsTest(){

		Integer productNum = 10;
		createProducts(productNum);

		List<String> fields = new List<String>();
		List<String> filterName = new List<String>();
		List<String> filterValue = new List<String>();
		String name = 'O-CODE';

		fields.add('Id');
		fields.add('Name');
		fields.add('Parent_Product__c');
		filterName.add('Catalog__c');
		filterValue.add('Current');

		List<Product2> parentProducts = [SELECT Id, Name FROM Product2 WHERE RecordType.DeveloperName = 'Parent_Product'];
		List<Product2> optList = SSG_ContractProductSelectorHelper.getRelatedOptions(parentProducts[1].Id, fields, filterName, filterValue, name);

		System.debug(parentProducts);
		System.debug([SELECT Id, Name, Parent_Product__c FROM Product2 WHERE RecordType.DeveloperName = 'Option_Product']);
		System.debug(optList);

		System.debug(parentProducts[1].Id);

		System.assert(optList.size() == 1);

	}

	@isTest
	static void getPicklistsValuesTest(){

		SSG_ContractProductSelectorHelper.getPicklistsValues();

	}

	@isTest
	static void importLineItemTest(){

		Test.startTest();
		createProducts(10);
		List<Product2> prods = [SELECT Id, Name FROM Product2];

		List<String> productList = new List<String>();
		productList.add(prods[0].Id);
		List<String> deliveryModeList = new List<String>();
		deliveryModeList.add('SaaS');
		List<String> licencePriceList = new List<String>();
		licencePriceList.add('100');
		List<String> entryFeeList = new List<String>();
		entryFeeList.add('100');
		List<String> annualMainteinanceList = new List<String>();
		annualMainteinanceList.add('100');
		List<String> annualSubscriptionList = new List<String>();
		annualSubscriptionList.add('100');
		List<String> quantityList = new List<String>();
		quantityList.add('1');
		List<String> priceMetricList = new List<String>();
		priceMetricList.add('100');
		List<String> costList = new List<String>();
		costList.add('100');


		Account dummyAccount = new Account(
			Name = 'Test Account',
			RecordTypeId = Schema.SObjectType.Account.getRecordTypeInfosByName().get('Standard Account').getRecordTypeId(),
			Type = 'Client',
			Industry = 'Bank',
			Company_Size__c = '1-10',
			Rating = 'Hot',
			Region__c = 'MEA',
			Mkt_Ops_Country_Zone__c = 'MEA - North Africa'
		);
		insert dummyAccount;

		Contract__c dummyContract = new Contract__c(
			Name = 'Test Contract',
			Account_Name__c = dummyAccount.Id,
			Contract_URL__c = 'www.database.com/Test_Contract',
			Contract_Start_Date__c = Date.newInstance(2022, 01, 01),
			Contract_End_Date__c = Date.newInstance(2022, 02, 02),
			Contract_term_months__c = 1,
			Contract_Expiration_Action__c = 'Rolling Contract',
			Current_Contract_End_Date__c = Date.newInstance(2022, 02, 02)
		);
		insert dummyContract;
		Test.stopTest();

		SSG_ContractProductSelectorHelper.importLineItem(
			dummyContract.Id,
			productList,
			deliveryModeList,
			licencePriceList,
			entryFeeList,
			annualMainteinanceList,
			annualSubscriptionList,
			quantityList,
			priceMetricList,
			costList
		);

	}

	static void createProducts(Integer num){

		Pricebook2 priceBook = new Pricebook2(
			Id = Test.getStandardPricebookId(),
    		IsActive = true
		);

		update priceBook;

		List<Product2> importParentProduct2List = new List<Product2>();
		List<Product2> importOptionProduct2List = new List<Product2>();
		Product2 bufferProduct;

		List<String> idTypes = new List<String>();
		idTypes.add(Schema.SObjectType.Product2.getRecordTypeInfosByName().get('Product').getRecordTypeId());
		idTypes.add(Schema.SObjectType.Product2.getRecordTypeInfosByName().get('Option').getRecordTypeId());

		Integer parentProductsNum = num;
		Integer optionProductsNum = num;

		// create Parent Products
		for(Integer i = 0; i < parentProductsNum; i++){

			bufferProduct = new Product2();
			bufferProduct.Name = 'Test Parent Product ' + i;
			bufferProduct.ProductCode = 'P-CODE-' + i;
			bufferProduct.Catalog__c = 'Current';
			bufferProduct.Partner_Product__c = true;
			bufferProduct.IsActive = true;
			bufferProduct.Sub_GTM__c = 'SBP Cards';
			bufferProduct.recordTypeId = idTypes[0];
			importParentProduct2List.add(bufferProduct);

		}
		insert importParentProduct2List;

		for(Integer i = 0; i < optionProductsNum; i++){

			bufferProduct = new Product2();
			bufferProduct.Name = 'Test Option Product ' + i;
			bufferProduct.ProductCode = 'O-CODE-' + i;
			bufferProduct.Catalog__c = 'Current';
			bufferProduct.IsActive = true;
			bufferProduct.recordTypeId = idTypes[1];
			bufferProduct.Parent_Product__c = importParentProduct2List[i].Id;
			importOptionProduct2List.add(bufferProduct);

		}
		insert importOptionProduct2List;
		List<PricebookEntry> entries = new List<PricebookEntry>();
		for(Product2 prod: importParentProduct2List){
			entries.add(new PricebookEntry(
				UnitPrice = 0,
				Product2Id = prod.Id,
				Pricebook2Id = Test.getStandardPricebookId(),
				currencyISOCode = 'EUR',
				IsActive = true
			));
			entries.add(new PricebookEntry(
				UnitPrice = 0,
				Product2Id = prod.Id,
				Pricebook2Id = Test.getStandardPricebookId(),
				currencyISOCode = 'GBP',
				IsActive = true
			));
		}
		for(Product2 prod: importOptionProduct2List){
			entries.add(new PricebookEntry(
				UnitPrice = 0,
				Product2Id = prod.Id,
				Pricebook2Id = Test.getStandardPricebookId(),
				currencyISOCode = 'EUR',
				IsActive = true
			));
			entries.add(new PricebookEntry(
				UnitPrice = 0,
				Product2Id = prod.Id,
				Pricebook2Id = Test.getStandardPricebookId(),
				currencyISOCode = 'GBP',
				IsActive = true
			));
		}
		try {
			Database.insert(entries, false);
		} catch (DmlException e) {
			System.debug('ALREADY');
		}

	}

}