/**
 * @description       :
 * @author            : Antonio Sabatino
 * @group             :
 * @last modified on  : 09-30-2022
 * @last modified by  : Antonio Sabatino
**/
@isTest
public class SSG_OptyRecordPageController_TEST {

	@isTest
	static void getOptyInfoTEST(){

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

		Opportunity dummyOpportunity = new Opportunity(
			Name = 'Test Opportunity',
			RecordTypeId = Schema.SObjectType.Opportunity.getRecordTypeInfosByName().get('MKT Opportunity').getRecordTypeId(),
			StageName = '0 / Early Stage',
			CloseDate = Date.newInstance(2025, 10, 10),
			AccountId = dummyAccount.Id,
			Type = 'Hunting',
			Need__c = 'Lorem Ipsum',
			Solution_Offering__c = 'Core SAB'
		);
		insert dummyOpportunity;

		Test.startTest();
		Opportunity opty = SSG_OptyRecordPageController.getOptyInfo(dummyOpportunity.Id);
		System.assert(opty != null);
	}

}