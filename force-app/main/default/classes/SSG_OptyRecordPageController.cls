/**
 * @description       :
 * @author            : Antonio Sabatino
 * @group             :
 * @last modified on  : 09-15-2022
 * @last modified by  : Antonio Sabatino
**/
public class SSG_OptyRecordPageController {

	@AuraEnabled(cacheable=true)
	public static Opportunity getOptyInfo(String Id){

		return [
			SELECT Id, BU__c, Country__c, Division__c, GBU__c, Mkt_Ops_Country_Zone__c
			FROM Opportunity
			WHERE Id =: Id
		];

	}
}