import { LightningElement, api, wire, track } from 'lwc';
import getCampaignMembers from '@salesforce/apex/CustomCampaignHistoryHelper.getCampaignMembers';
import { NavigationMixin } from 'lightning/navigation';
import { encodeDefaultFieldValues } from 'lightning/pageReferenceUtils';
import { deleteRecord } from 'lightning/uiRecordApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import LightningConfirm from 'lightning/confirm';
import { refreshApex } from '@salesforce/apex';

const MAX_RELATED_SIZE_NUMBER_DISPLAY = 3;

const BUTTONS = {
	BUTTON_CANCEL_MODAL: 'ssg-custom-campaign-history-related-list-button-cancel-modal',
	BUTTON_NEXT_MODAL: 'ssg-custom-campaign-history-related-list-button-next-modal'
}

const OBJECT_TO_FIELD = {
	'Lead': 'LeadId',
	'Contact': 'ContactId'
}

const ACTIONS_NAMES = {
	EDIT: 'ssg-custom-campaign-history-related-list-action-edit',
	DELETE: 'ssg-custom-campaign-history-related-list-action-delete'
}

const ACTIONS = [
	{label: 'Edit', name: ACTIONS_NAMES.EDIT},
	{label: 'Delete', name: ACTIONS_NAMES.DELETE}
]

const COLUMNS = [
	{label: 'Campaign Name', fieldName: 'CampaignId', type: 'url', typeAttributes: {label: { fieldName: 'CampaignName' }}},
	{label: 'Start Date', fieldName: 'CampaignStartDate', type: 'Date'},
	{label: 'Type', fieldName: 'Type', type: 'Text'},
	{label: 'Status', fieldName: 'Status', type: 'Text'},
	{type: 'action', typeAttributes: { rowActions: ACTIONS }}
]

export default class SSG_CustomCampaignHistoryRelatedList extends NavigationMixin(LightningElement) {

	@api object_name;
	@api recordId;
	@api flexipageRegionWidth;
	@api campaignHistorySize = 1;
	@api relateds = [];
	@api viewAllLink;
	@track openModal = false;
	@track selectedCampaignId;
	@track nextButtonDisabled = false;

	columns = COLUMNS;
	_wiredData;

	get smallLayout(){return 'SMALL' === this.flexipageRegionWidth;}
	get sizeClass(){return `${this.flexipageRegionWidth} slds-card slds-card_boundary`;}
	get header_class(){return ` related-list slds-grid slds-page-header slds-page-header_joined slds-page-header_bleed slds-shrink-none test-headerRegion`}
	get body_class(){ return `slds-size_full datatable-container`;}

	get buttonCancelModal() {return BUTTONS.BUTTON_CANCEL_MODAL;}
	get buttonNextModal() {return BUTTONS.BUTTON_NEXT_MODAL;}
	get tileActions() {return ACTIONS.map(element => { return {label: element.label, value: element.name}})}

	get viewAllLink() {
		return `/lightning/r/${this.object_name}/${this.recordId}/related/CampaignMembers/view`
	}

	connectedCallback(){
		console.log('Connected');
		console.log('Related: ', this.relateds);
		return refreshApex(this._wiredData);
	}

	renderedCallback(){
		console.log('Rendered');
	}

	@wire(getCampaignMembers, {recordId: '$recordId', parentObject: '$object_name'})
	getCampaignMembersHandler(wireResult){
		const { data, error } = wireResult;
    	this._wiredData = wireResult;
		if(data){
			console.log("[SSG_CustomCampaignHistoryRelatedList/getCampaignMembersHandler] return Data:", JSON.parse(JSON.stringify(data)));
			this.relateds = JSON.parse(JSON.stringify(data)).map(record => {
				return {
					Id: record.Id,
					CampaignId: `/${record.Campaign.Id}`,
					CampaignName: record.Campaign.Name,
					CampaignStartDate: record.Campaign.StartDate,
					Type: record.Campaign.Type,
					Status: record.Status
				}
			});
			this.campaignHistorySize = this.relateds.length <= MAX_RELATED_SIZE_NUMBER_DISPLAY ? this.relateds.length : `${MAX_RELATED_SIZE_NUMBER_DISPLAY}+`;
			this.relateds = this.relateds.length > 3 ? this.relateds.slice(0, 3) : this.relateds;
		} else if(error){
			console.error(error);
		}
	}

	showModal() {
        this.openModal = true;
		this.nextButtonDisabled = true;
    }
    closeModal() {
        this.openModal = false;
    }

	buttonMenuSelected(event){
		if(event.detail.value == 'add-to-campaign'){
			this.showModal();
		}
	}

	refreshOnEditOrCreate(isEdit){

		let endsWith;
		if(isEdit){
			endsWith = '/edit';
		} else {
			endsWith = '/new';
		}

		if(location.pathname.endsWith(endsWith)){
			setTimeout(() => this.refreshOnEditOrCreate(isEdit), 1000);
		} else {
			return refreshApex(this._wiredData);
		}
	}

	handleCampaignSelection(event){

		this.selectedCampaignId = event.target.value;
		this.nextButtonDisabled = false;

    }

	handleNavigationButtons(event){
		const pressedButton = event.target.name;
		console.log('Pressed Button: ', pressedButton);

		switch (pressedButton) {
			case BUTTONS.BUTTON_NEXT_MODAL:
				this.closeModal();
				this.navigateToNewRecordPage();
				break;
			case BUTTONS.BUTTON_CANCEL_MODAL:
				this.closeModal();
				break;
		}
	}

	handleRowAction(event){
		const actionName = event.detail.action.name;
		const row = JSON.parse(JSON.stringify(event.detail.row));
		this.handleActions(actionName, row.Id);
	}

	handleTileAction(event){
		const tileAction = JSON.parse(JSON.stringify(event.detail.action.value));
		const recId =JSON.parse(JSON.stringify( event.target.dataset.item));
		this.handleActions(tileAction, recId);
	}

	handleActions(action, recId){
		switch (action) {
			case ACTIONS_NAMES.EDIT:
				this.editCampaignMember(recId);
				break;
			case ACTIONS_NAMES.DELETE:
				this.deleteCampaignMember(recId)
				console.log('delete');
				break;
		}
	}

	navigateToNewRecordPage() {

		const defaultValues = encodeDefaultFieldValues({
            [OBJECT_TO_FIELD[this.object_name]]: this.recordId,
            CampaignId: this.selectedCampaignId,
        });

        this[NavigationMixin.Navigate]({
            type: 'standard__objectPage',
            attributes: {
                objectApiName: 'CampaignMember',
                actionName: 'new'
            },
            state: {
                defaultFieldValues: defaultValues,
				navigationLocation: 'RELATED_LIST'
			}
        });
		setTimeout(() => this.refreshOnEditOrCreate(false), 1000);
    }

	editCampaignMember(recordToEdit){
		this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: {
                recordId: recordToEdit,
				objectApiName: 'CampaignMember',
                actionName: 'edit'
            }
        })
		setTimeout(() => this.refreshOnEditOrCreate(true), 1000);
	}

	async deleteCampaignMember(recordToDelete){
		const result = await LightningConfirm.open({
            message: 'Are you sure you want to delete this campaign member?',
            variant: 'header',
            label: 'Delete Campaign Member',
        });
		if(result){
			deleteRecord(recordToDelete)
			.then(() => {
				const event = new ShowToastEvent({
					message: 'Campaign Member was deleted',
				});
				this.dispatchEvent(event);
				console.log('DELETED')
				return refreshApex(this._wiredData);
			})
		}
	}

}