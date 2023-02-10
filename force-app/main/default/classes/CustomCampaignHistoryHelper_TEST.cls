/**
 * @description       :
 * @author            : Antonio Sabatino
 * @group             :
 * @last modified on  : 01-12-2023
 * @last modified by  : Antonio Sabatino
**/
@isTest
public class CustomCampaignHistoryHelper_TEST {

	@TestSetup
	static void makeData(){

		Campaign c = new Campaign(name='Test Campaign', isActive=true, Type='Conference / Trade Shows / Events');
		insert c;

		Account acc = new Account(Name = 'Account TEST', Industry = 'Bank', Type = 'Client', Website = 'www.google.com', Region__c = 'MEA', Account_Approval_Status__c = 'Approved');
		insert acc;

		Contact cont = new Contact(LastName='Test Contact', AccountId=acc.Id, Title='Test Title', Email='test.email12412523562343215@gmail.com', Business_Infos_on_Contact__c='Sponsor', Phone='1234567890');
		insert cont;

		Lead le = new Lead(LastName='Test Lead', Company='Test Company', Email='test.email312059721358@gmail.com');
		insert le;

		List<CampaignMember> cms = new List<CampaignMember>();
		cms.add(new CampaignMember(CampaignId=c.Id,ContactId=cont.Id));
		cms.add(new CampaignMember(CampaignId=c.Id,LeadId=le.Id));
		insert cms;

	}

	@isTest
	static void test(){

		Contact cont = [SELECT Id FROM Contact LIMIT 1];
		Lead lea = [SELECT Id FROM Lead LIMIT 1];

		CustomCampaignHistoryHelper.getCampaignMembers(cont.Id, 'Contact');
		CustomCampaignHistoryHelper.getCampaignMembers(lea.Id, 'Lead');

	}

}