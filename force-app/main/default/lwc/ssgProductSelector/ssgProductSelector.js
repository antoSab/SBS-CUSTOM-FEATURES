/**
 * @description       : Custom Selector For Products
 * @author            : Antonio Sabatino
 * @group             : Sopra Steria Group
 * @last modified on  : 02-10-2023
 * @last modified by  : Antonio Sabatino
**/
import { LightningElement, track, api, wire } from 'lwc';
import FORM_FACTOR from '@salesforce/client/formFactor';
import DESKTOP_TEMPLATE from './desktopTemplate';
import PHONE_TEMPLATE from './phoneTemplate';
import { CurrentPageReference } from 'lightning/navigation';
import { NavigationMixin } from 'lightning/navigation';

const ICON = 'ssg-icon';
const LABEL = 'ssg-label';

export default class SsgProductSelector extends NavigationMixin(LightningElement) {

	_recordSettings = {};
	_isFirstPage = false;

	@track status;

	_objectApiNameToObjectInfo = new Map();

	/* GETTERS AND SETTERS */
	get isDesktop() {return FORM_FACTOR === 'Large' || FORM_FACTOR === 'Medium' ? true : false;}
	get isSelecting() {return this._isFirstPage;}
	get objectIcon() {return this._recordSettings.objectIconName;}
	get objectLabel() {return this._recordSettings.objectLabel;}
	get recordName() {return this._recordSettings.recordName;}

	/* SETUP */
	setup(){
		this._isFirstPage = true;
		this._objectApiNameToObjectInfo.set('Opportunity', {[LABEL]: 'Opportunity', [ICON]: 'standard:opportunity'});
		this._objectApiNameToObjectInfo.set('Contract__c', {[LABEL]: 'Contract', [ICON]: 'standard:contract'});
	}

	/* WIRES */
	@wire(CurrentPageReference)
	getStateParameters(currentPageReference) {
		if (currentPageReference) {
			this._recordSettings.recordId = currentPageReference.state.c__RecordId;
			this._recordSettings.recordName = currentPageReference.state.c__RecordName;
			this._recordSettings.objectApiName = currentPageReference.state.c__ObjectApiName;

			this.setup();

			this._recordSettings.objectLabel = this._objectApiNameToObjectInfo.get(this._recordSettings.objectApiName)[LABEL];
			this._recordSettings.objectIconName = this._objectApiNameToObjectInfo.get(this._recordSettings.objectApiName)[ICON];
       	}
    }

	/* STANDARD FUNCTIONS */
	render(){return this.isDesktop ? DESKTOP_TEMPLATE : PHONE_TEMPLATE;}

	goToRecord(){
		this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: {
                recordId: this._recordSettings.recordId,
                actionName: 'view',
            },
        });
	}

}