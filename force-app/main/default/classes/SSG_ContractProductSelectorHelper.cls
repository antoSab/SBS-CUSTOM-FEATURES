/**
 * @description       :
 * @author            : Antonio Sabatino
 * @group             :
 * @last modified on  : 12-06-2022
 * @last modified by  : Antonio Sabatino
**/
public without sharing class SSG_ContractProductSelectorHelper {
    static final String PARENT_PRODUCT = 'Parent_Product';
	static final String OPTION_PRODUCT = 'Option_Product';

	@AuraEnabled(cacheable=true)
	public static UserRecordAccess getAccessLevel(String userId, String recordId){

		return [SELECT RecordId, HasEditAccess FROM UserRecordAccess WHERE UserId =: userId AND RecordId =: recordId];

	}

	@AuraEnabled(cacheable=true)
	public static List<Product2> getProducts(List<String> fields, List<String> filterName, List<String> filterValue, String name, String OpportunityISOcode){

		System.debug('INSERT');

		Set<Id> currencyProducts = new Set<Id>();
		for(PricebookEntry entry: [SELECT Id, Product2Id  FROM PricebookEntry WHERE Pricebook2.IsStandard = true AND CurrencyIsoCode = :OpportunityISOcode]){
			currencyProducts.add(entry.Product2Id);
		}
		System.debug([SELECT Id, Product2Id, CurrencyIsoCode FROM PricebookEntry WHERE Pricebook2.IsStandard = true AND CurrencyIsoCode = :OpportunityISOcode]);
		List<String> queryStrings = new List<String>();

		List<String> selectStrings = new List<String>();
		selectStrings.add('SELECT');
		selectStrings.add(String.join(fields, ', '));
		queryStrings.add(String.join(selectStrings, ' '));

		queryStrings.add('FROM Product2');

		List<String> whereStrings = new List<String>();
		whereStrings.add('WHERE RecordType.DeveloperName = \'Parent_Product\' AND IsActive = true AND');
		System.debug(filterValue);
		for(Integer i = 0; i < filterName.size(); i++){
			if(filterValue[i] != null && !filterValue[i].equals('null')){
				if(filterName[i].equals('Offer_GTM__c') || filterName[i].equals('Sub_GTM__c')){
					whereStrings.add(filterName[i] + ' includes (\'' + filterValue[i] + '\') AND');
				} else if(filterValue[i].equals('true') || filterValue[i].equals('false')){
					whereStrings.add(filterName[i] + ' = ' + filterValue[i] + ' AND');
				} else {
					whereStrings.add(filterName[i] + ' = \'' + filterValue[i] + '\' AND');
				}
			}
		}
		if(!name.equals('null')){
			whereStrings.add('( Name LIKE \'%' + name + '%\' OR ProductCode LIKE \'%' + name + '%\') AND');
		}
		if(!whereStrings.isEmpty()){
			String tempString = String.join(whereStrings, ' ');
			if(tempString.substring(tempString.length()-3).equals('AND')){
				queryStrings.add(tempString.substring(0, tempString.length()-3));
			}
		}


		queryStrings.add('ORDER BY Name ASC LIMIT 50');


		/*
		return [
			SELECT Id, Name, Offer_GTM__c
			FROM Product2
			WHERE IsActive = true AND RecordType.DeveloperName = :PARENT_PRODUCT
			ORDER BY Name ASC
			LIMIT :Integer.valueOf(queryLimit)
		];
		*/
		List<Product2> retList = new List<Product2>();
		System.debug(Database.query(String.join(queryStrings, ' ')));
		for(Product2 product: Database.query(String.join(queryStrings, ' '))){
			if(currencyProducts.contains(product.Id)){
				retList.add(product);
			}
		}
		return retList;

	}

	@AuraEnabled(cacheable=true)
	public static List<Product2> getRelatedOptions(String productId, List<String> fields, List<String> filterName, List<String> filterValue, String name){

		List<String> queryStrings = new List<String>();

		List<String> selectStrings = new List<String>();
		selectStrings.add('SELECT');
		selectStrings.add(String.join(fields, ', '));
		queryStrings.add(String.join(selectStrings, ' '));

		queryStrings.add('FROM Product2');

		List<String> whereStrings = new List<String>();
		whereStrings.add('WHERE IsActive = true AND RecordType.DeveloperName = \'Option_Product\' AND Parent_Product__c = \'' + productId + '\' AND');
		System.debug(filterValue);
		for(Integer i = 0; i < filterName.size(); i++){

			if(filterValue[i] != null && !filterValue[i].equals('null')){
				if(filterName[i].equals('Offer_GTM__c') || filterName[i].equals('Sub_GTM__c')){
					whereStrings.add(filterName[i] + ' includes (\'' + filterValue[i] + '\') AND');
				} else {
					whereStrings.add(filterName[i] + ' = \'' + filterValue[i] + '\' AND');
				}
			}
		}
		if(!name.equals('null')){
			whereStrings.add('( Name LIKE \'%' + name + '%\' OR ProductCode LIKE \'%' + name + '%\') AND');
		}
		if(!whereStrings.isEmpty()){
			String tempString = String.join(whereStrings, ' ');
			if(tempString.substring(tempString.length()-3).equals('AND')){
				queryStrings.add(tempString.substring(0, tempString.length()-3));
			}
		}


		queryStrings.add('ORDER BY Name ASC');
		System.debug(String.join(queryStrings, ' '));
		return Database.query(String.join(queryStrings, ' '));


		/*
		return [
			SELECT Id, Name
			FROM Product2
			WHERE IsActive = true AND RecordType.DeveloperName = :OPTION_PRODUCT AND Parent_Product__c = :productId
			ORDER BY Name ASC
		];
		*/
	}

	@AuraEnabled(cacheable=true)
	public static string getPicklistsValues(){

		Map<String,List<Schema.PicklistEntry>> entries = new Map<String,List<Schema.PicklistEntry>>();
		entries.put('Business Domain', Product2.Sub_GTM__c.getDescribe().getPicklistValues()); // business domain
		entries.put('Status', Product2.Catalog__c.getDescribe().getPicklistValues()); //status
		entries.put('Delivery Mode', Contract_Item__c.Delivery_Mode__c.getDescribe().getPicklistValues()); // delivery modes
		entries.put('Business Sub Domain', Product2.Business_Sub_Domain__c.getDescribe().getPicklistValues()); // business sub domain
		entries.put('Offer GTM', Product2.Offer_GTM__c.getDescribe().getPicklistValues()); //offer GTM

		return JSON.serialize(entries);
	}

	@AuraEnabled
	public static string importLineItem(String contractId, List<String> productList, List<String> deliveryModeList, List<String> licencePriceList, List<String> entryFeeList, List<String> annualMainteinanceList, List<String> annualSubscriptionList, List<String> quantityList, List<String> priceMetricList, List<String> costList){

		List<Contract_Item__c> lineItemList = new List<Contract_Item__c>();
		Contract_Item__c bufferItem;

		for(Integer i = 0; i < productList.size(); i++){
			bufferItem = new Contract_Item__c();
			bufferItem.IdContract__c = contractId;
			bufferItem.Product2__c = productList[i];
			if(!deliveryModeList[i].equals('empty')) bufferItem.Delivery_Mode__c = deliveryModeList[i];
			bufferItem.Licence_Price__c = Decimal.valueOf(licencePriceList[i]);
			bufferItem.Entry_Fee__c = Decimal.valueOf(entryFeeList[i]);
			bufferItem.Annual_Maintenace__c = Decimal.valueOf(annualMainteinanceList[i]);
			bufferItem.Annual_Subscription_price__c = Decimal.valueOf(annualSubscriptionList[i]);
			bufferItem.Quantity__c = Decimal.valueOf(quantityList[i]);
			if(!priceMetricList[i].equals('empty')) bufferItem.Price_metrics__c = priceMetricList[i];
			if(!costList[i].equals('empty')) bufferItem.Cost_if_external__c = Decimal.valueOf(costList[i]);
			lineItemList.add(bufferItem);
		}

		Database.insert(lineItemList, false);
		return 'true';

	}
}