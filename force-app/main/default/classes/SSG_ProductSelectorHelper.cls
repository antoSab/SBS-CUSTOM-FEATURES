/**
 * @description       : DML Support for force-app/main/default/lwc/sSGProductSelectorPageOne
 * @author            : Antonio Sabatino
 * @group             : Sopra Steria Group
 * @last modified on  : 12-06-2022
 * @last modified by  : Antonio Sabatino
**/
public without sharing class SSG_ProductSelectorHelper {

	static final String PARENT_PRODUCT = 'Parent_Product';
	static final String OPTION_PRODUCT = 'Option_Product';

	@AuraEnabled(cacheable=true)
	public static UserRecordAccess getAccessLevel(String userId, String recordId){

		return [SELECT RecordId, HasEditAccess FROM UserRecordAccess WHERE UserId =: userId AND RecordId =: recordId];

	}

	@AuraEnabled(cacheable=true)
	public static List<Product2> getProducts(List<String> fields, List<String> filterName, List<String> filterValue, String name, String OpportunityISOcode){

		Set<Id> currencyProducts = new Set<Id>();
		for(PricebookEntry entry: [SELECT Id, Product2Id  FROM PricebookEntry WHERE Pricebook2.IsStandard = true AND CurrencyIsoCode = :OpportunityISOcode]){
			currencyProducts.add(entry.Product2Id);
		}
		List<String> queryStrings = new List<String>();

		/* CHOOSING THE FIELDS */
		List<String> selectStrings = new List<String>();
		selectStrings.add('SELECT');
		selectStrings.add(String.join(fields, ', '));
		queryStrings.add(String.join(selectStrings, ' ')); //RESULT -> SELECT Field_1, Field_2, ... , Field_N

		/* CHOOSING THE OBJECT */
		queryStrings.add('FROM Product2');

		/* SETTING THE CONDITIONS */
		List<String> whereStrings = new List<String>();
		// Querying for Active Parent Products which have a PriceBook Entry in the standard Pricebook with the same Currency of the Opportunity since we have activated multicurrency
		whereStrings.add('WHERE RecordType.DeveloperName = \'Parent_Product\' AND IsActive = true AND');
		for(Integer i = 0; i < filterName.size(); i++){
			if(filterValue[i] != null && !filterValue[i].equals('null')){
				if(filterName[i].equals('Offer_GTM__c') || filterName[i].equals('Sub_GTM__c')){ // Multiselect Picklist Fields
					whereStrings.add(filterName[i] + ' includes (\'' + filterValue[i] + '\') AND');
				} else if(filterValue[i].equals('true') || filterValue[i].equals('false')){ // Boolean fields
					whereStrings.add(filterName[i] + ' = ' + filterValue[i] + ' AND');
				} else { // default
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

		/* --DYNAMIC QUERY RESULT--
			SELECT Field_1, Field_2, ..., Field_N
			FROM Product2
			WHERE Condition_1 AND Condition_2 AND ... AND Condition_N ORDER BY Name ASC LIMIT 50
		*/

		//[UNCOMMENT TO PRINT THE BUILT QUERY] System.debug(String.join(queryStrings, ' '));
		List<Product2> retList = new List<Product2>();
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
		entries.put('Delivery Mode', OpportunityLineItem.Delivery_Mode__c.getDescribe().getPicklistValues()); // delivery modes
		entries.put('Business Sub Domain', Product2.Business_Sub_Domain__c.getDescribe().getPicklistValues()); // business sub domain
		entries.put('Offer GTM', Product2.Offer_GTM__c.getDescribe().getPicklistValues()); //offer GTM

		return JSON.serialize(entries);
	}

	@AuraEnabled
	public static string importLineItem(String optyId, List<String> productList, List<String> deliveryModeList, List<String> licencePriceList, List<String> entryFeeList, List<String> annualMainteinanceList, List<String> annualSubscriptionList, List<String> quantityList, List<String> priceMetricList, List<String> costList){

		List<OpportunityLineItem> lineItemList = new List<OpportunityLineItem>();
		OpportunityLineItem bufferItem;

		Opportunity opty = [SELECT Id, Pricebook2Id, CurrencyISOCode FROM Opportunity WHERE Id =: optyId];
		Map<Id, Id> prodToPricebook = new Map<Id,Id>();

		for(PricebookEntry entry: [SELECT Id, Product2Id FROM PricebookEntry WHERE Product2Id IN: productList AND pricebook2Id =: opty.Pricebook2Id AND CurrencyISOCode =: opty.CurrencyISOCode]){
			prodToPricebook.put(entry.Product2Id, entry.Id);
		}

		for(Integer i = 0; i < productList.size(); i++){
			bufferItem = new OpportunityLineItem();
			bufferItem.PricebookEntryId = prodToPricebook.get(productList[i]);
			bufferItem.OpportunityId = optyId;
			bufferItem.product2Id = productList[i];
			if(!deliveryModeList[i].equals('empty')) bufferItem.Delivery_Mode__c = deliveryModeList[i];
			bufferItem.Licence_Price__c = Decimal.valueOf(licencePriceList[i]);
			bufferItem.Entry_Fee__c = Decimal.valueOf(entryFeeList[i]);
			bufferItem.Annual_Maintenace__c = Decimal.valueOf(annualMainteinanceList[i]);
			bufferItem.Annual_Subscription_price__c = Decimal.valueOf(annualSubscriptionList[i]);
			bufferItem.Quantity = Decimal.valueOf(quantityList[i]);
			if(!priceMetricList[i].equals('empty')) bufferItem.Price_metrics__c = priceMetricList[i];
			if(!costList[i].equals('empty')) bufferItem.Cost_if_external__c = Decimal.valueOf(costList[i]);
			lineItemList.add(bufferItem);
		}

		Database.SaveResult[] srList = Database.insert(lineItemList, false);


		// Iterate through each returned result
		for (Database.SaveResult sr : srList) {
			if (sr.isSuccess()) {
				// Operation was successful, so get the ID of the record that was processed
				System.debug('Successfully inserted : ' + sr.getId());
			}
			else {
				// Operation failed, so get all errors
				for(Database.Error err : sr.getErrors()) {
					System.debug('The following error has occurred.');
					System.debug(err.getStatusCode() + ': ' + err.getMessage());
					System.debug('OP fields that affected this error: ' + err.getFields());
				}
			}
		}
		return 'true';

	}

}