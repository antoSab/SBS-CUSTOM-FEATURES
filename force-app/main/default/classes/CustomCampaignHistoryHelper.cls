/**
 * @description       :
 * @author            : Antonio Sabatino
 * @group             :
 * @last modified on  : 01-02-2023
 * @last modified by  : Antonio Sabatino
**/
public class CustomCampaignHistoryHelper {
    @AuraEnabled(cacheable=true)
	public static List<CampaignMember> getCampaignMembers(String recordId, String parentObject){

		if(parentObject == 'Lead'){
			return [SELECT Id, Campaign.Name, Campaign.StartDate, Campaign.Type, Status FROM CampaignMember WHERE LeadId = :recordId AND Campaign.Type = 'Conference / Trade Shows / Events'];
		} else if(parentObject == 'Contact'){
			return [SELECT Id, Campaign.Name, Campaign.StartDate, Campaign.Type, Status FROM CampaignMember WHERE ContactId = :recordId AND Campaign.Type = 'Conference / Trade Shows / Events'];
		}
		return null;
	}
}